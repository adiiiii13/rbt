import { init, getAuthToken } from "@heyputer/puter.js/src/init.cjs";

const puter = init(await getAuthToken());

const res = await puter.ai.chat(
    `A company has 3 departments. Department A's budget is 20% more than B's. Department C's budget is 15% less than A and B combined. If the total budget is $14 million, calculate each department's budget. Show reasoning.`,
    { model: 'claude-opus-4-7' }
);

// Fixes the [object Object] output to get the actual text
console.log(res.message.content[0].text);
