const snippets = {greeting: "How are you?", feeling: "fine"};

const string = "Hello World. $greeting What is your name? I'm feeling $feeling and you?";

console.log(string.replace(/\$(.[^ ]+)/g, match => snippets[match.slice(1)]));