'use strict'

const steem = require('steem')
const Promise = require('bluebird')
const { voters, authors } = require('../../config')

module.exports = {
    execute
}

function get_author(author) {
    const found = authors.filter((listed) => listed.name === author)
    return  found ? found.pop() : null
}

function processComment(comment) {
    const author = get_author(comment.author)

    if (author) {
        return upvote(comment)
    }
    return Promise.resolve(null)
}


function upvote(comment, author) {
    return voters.map((voter) => {
        const wrapper = () => {
            return steem.broadcast.voteAsync(
                voter.wif, 
                voter.name, 
                comment.author,
                comment.permlink,
                author.weight
            )
            .then((results) =>  {
                console.log("Vote results: ", results)
                return results;
            },
            (err) => {
                console.log("Vote failed for %s: %s", voter.name, err.message)
                return err
            })
        }

        if (voter.delay) {
            setTimeout(wrapper, voter.delay);
        }
    })
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
            switch(operation_name) {
                case 'comment':
                    if (operation.parent_author == '') {
                        processComment(operation)
                            .catch((e) => {
                                console.log("Failed to process comment ", e)
                            });
                    }
                    break;
                default:
            }
        })
        .catch((err) => {
            console.log("Bot died. Restarting ... ", err)
            execute()
        })
    })
}