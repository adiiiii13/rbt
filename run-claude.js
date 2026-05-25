import { init, getAuthToken } from "@heyputer/puter.js/src/init.cjs";

async function main() {
    console.log("Opening browser for Puter authentication...");
    const authToken = await getAuthToken(); 
    const puter = init(authToken);

    console.log("Sending prompt to Claude 3.7 Opus...");
    const response = await puter.ai.chat(
        `A company has 3 departments. Department A's budget is 20% more than B's.
        Department C's budget is 15% less than A and B combined.
        If the total budget is $14 million, calculate each department's budget.
        Show your step-by-step reasoning.`,
        { model: 'claude-opus-4-7' }
    );

    console.log("\n--- Response ---");
    console.log(response.message.content.toString());
}

main().catch(console.error);
