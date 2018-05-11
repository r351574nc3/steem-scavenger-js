'use strict'

const steem = require('steem')
const { voters, authors } = require('../../config')

module.exports = {
    execute
}

function execute() {

    console.log("Processing votes from stream of operations")
    steem.api.streamOperations((err, results) => {
        if (err) {
            console.log("Unable to stream operations %s", err)
            notifier.emit("fail");
            return 
        }
        return Promise.resolve(results).spread((operation_name, operation) => {

            if (counter % 1000 == 0) {
                counter = 0
                console.log("Processing %s on %s", operation, new Date())
            }

            switch(operation_name) {
                case 'comment':
                    if (operation.parent_author == '') {
                        processComment(operation)
                            .catch((e) => {
                                console.log("Failed to process comment ", e)
                            });
                    }
                    break;
                case 'vote':
                    processVote(new Vote(operation))
                    break;
                case 'unvote':
                    processUnvote(new Vote(operation))
                    break;
                default:
            }
            counter++
            heartbeat = moment();
        })
        .catch((err) => {
            console.log("Bot died. Restarting ... ", err)
        })
    })
}