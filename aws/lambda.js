const AWS = require('aws-sdk')
const ENDPOINT = '08ohe3ecjh.execute-api.eu-central-1.amazonaws.com/production'
const client = new AWS.ApiGatewayManagementApi ({ endpoint: ENDPOINT });
const dynamoDB = new AWS.DynamoDB.DocumentClient();
let users = {};
let blocks = [];

AWS.config.update({
  maxRetries: 5,
  httpOptions: {
    timeout: 15 * 1000,
    connectTimeout: 30 * 1000,
  },
});

async function DBgetBlocks(x, y, value) {
    const params = {
        TableName: 'mmo-db-blocks'
    }
    try {
        const blocks = await dynamoDB.scan(params).promise();
        return blocks.Items.map((item) => ({
           x: item.coord.split(':')[0],
           y: item.coord.split(':')[1],
           color: item.color
        }))
    } catch (err) {
        return err
    }
}

async function DBaddBlock(x, y, color) {
    const params = {
        TableName: 'mmo-db-blocks',
        Item: {
            coord: `${x}:${y}`,
            color
        }
    }
    try {
        await dynamoDB.put(params).promise()
    } catch (err) {
        return err
    }
}

async function DBremoveBlock(x, y) {
    const params = {
        TableName: 'mmo-db-blocks',
        Key: {
            coord: `${x}:${y}`
        }
    }
    try {
        await dynamoDB.delete(params, () => {}).promise()
    } catch (err) {
        console.error(err)
        return err
    }
}

async function DBcountBlocks() {
    const params = {
        TableName: 'mmo-db-blocks',
        Select: 'COUNT'
    }
    try {
        return await dynamoDB.scan(params, () => {}).promise()
    } catch (err) {
        return err
    }
}

async function DBset(key, value) {
    const params = {
        TableName: 'mmo-db',
        Item: {
            key,
            value
        },
    }
    try {
        await dynamoDB.put(params).promise()
    } catch (err) {
        return err
    }
}

async function DBget() {
    var params = {
        TableName: 'mmo-db'
    }
    try {
        return dynamoDB.scan(params).promise()
    } catch (err) {
        return err
    }
}

const sendMessage = (ids, body) => (
    Promise.all(ids.map((id) => {
        console.log(`Sent to ${id}`)
        return client.postToConnection({
            'ConnectionId': id,
            'Data': Buffer.from(JSON.stringify(body)),
        }).promise().catch((...err) => {
            console.error(...err)
            delete users[id]
        })
    }))
)

const sendToAll = (body) => (
    sendMessage(Object.keys(users), body)
)

const parseBody = (body) => {
    try {
        console.log(body)
        return JSON.parse(body)
    }
    catch (err) {
        return null
    }
}

const handler = async(event, context) => {
    if (event.requestContext) {
        const id = event.requestContext.connectionId
        const route = event.requestContext.routeKey
        const body = parseBody(event.body)
        
        if (!body) {
            console.error('Could not retrieve body')
        }
        
        const db = await DBget();
        users = db.Items.find(({ key }) => key === 'users')?.value || {};
        
        if ((await DBcountBlocks()).Count !== blocks.length) {
            blocks = await DBgetBlocks();
        }

        const buffer = [];
        const chunkSize = 1000;
        
        switch(route) {
            case '$connect':
                break
            case '$disconnect':
                await Promise.all([
                    sendToAll({
                        type: 'serverMessage',
                        message: `${users[id]} disconnected`
                    }),
                    sendToAll({
                        type: 'playerLeft',
                        name: users[id]
                    })
                ])
                delete users[id]
                await DBset('users', users);
                break
            case '$default':
                await sendToAll({
                    type: 'unknown command'
                })
                break
            case 'setName':
                users[id] = body.name
                for (let i = 0; i < blocks.length; i += chunkSize) {
                    const chunk = blocks.slice(i, i + chunkSize).filter((v) => v);
                    buffer.push(chunk)
                }
                await Promise.all([
                    sendToAll({
                        type: 'serverMessage',
                        message: `${users[id]} joined the game`
                    }),
                    sendToAll({
                        type: 'playerJoined',
                        name: users[id]
                    }),
                    sendMessage([id], {
                        type: 'allPlayers',
                        data: Object.values(users)
                    }),
                    DBset('users', users)
                ])
                await Promise.all(buffer.map((chunk) => (
                    sendMessage([id], {
                        type: 'addBlocks',
                        data: chunk
                    })
                )))
                break
            case 'move':
                await sendToAll({
                    type: 'move',
                    x: body.x,
                    y: body.y,
                    name: users[id]
                })
                break
            case 'build':
                await sendToAll({
                    type: 'build',
                    x: body.x,
                    y: body.y,
                    data: body.color
                })
                // await DBset('blocks', blocks)
                await DBaddBlock(body.x, body.y, body.color)
                break
            case 'remove':
                const block = blocks.find((block) => (
                    parseInt(block.x) === body.x
                    && parseInt(block.y) === body.y
                ));
                if (block) {
                    console.log("Found a block to be removed")
                    await DBremoveBlock(body.x, body.y)
                    await sendToAll({
                        type: 'remove',
                        x: body.x,
                        y: body.y
                    })
                } else {
                    console.log('Could not find the block :(')
                }
                break
            case 'message':
                await sendToAll({
                    type: 'message',
                    message: body.message,
                    name: users[id]
                })
                break
        }
    }
    
    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    }
    return response
}

exports.handler = handler