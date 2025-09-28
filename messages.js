
const messages = [
    {
    id: 1,
    user: "Test",
    time: "Now",
    message: "Yes",
    parent: null
    },
     {
    id: 2,
    user: "Test",
    time: "Now",
    message: "Hi",
    parent: null
    },
     {
    id: 3,
    user: "Test",
    time: "Now",
    message: "Whats the deal?",
    parent: null
    },
     {
    id: 4,
    user: "Test",
    time: "Now",
    message: "I dunno",
    parent: 3
    },
     {
    id: 5,
    user: "Test",
    time: "Now",
    message: "Same",
    parent: 3
    },
     {
    id: 6,
    user: "Test",
    time: "Now",
    message: "Me Either",
    parent: 3
    }
]

module.exports = {
    messages
}