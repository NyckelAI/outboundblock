# OutboundBlock (Powered by Nyckel)

<img width="751" alt="Screenshot 2024-02-18 at 3 55 14 PM" src="https://github.com/NyckelAI/chris/assets/20774922/e44afd34-7f52-4565-a08a-12aa8a5be60d">

The purpose of [OutboundBlock](https://www.outboundblock.com) is identify and block unwanted B2B spam, both sales-driven outbound emails and marketing-driven newsletter emails. This problem will only get worse with AI that makes automated, unsolicited emailing more common. While Gmail catches many of these - and tags many marketing ones as promotional - we all know that many still slip through the cracks. These emails fill up our inboxes and annoy us. So, this tool aims to fix that.

<img width="692" alt="Screenshot 2024-02-18 at 12 03 29 PM" src="https://github.com/NyckelAI/chris/assets/20774922/873ed678-db27-45e1-8d4a-dc73d267cc09">

The current beta version works as a Google App Script that anyone can use. You just need to copy and paste the code into your App Scripts account, then set up a trigger to have it run every 30 minutes. The code can be found in this repo under **outboundblock.gs**. 

## Setting it up

1. Go to [App Scripts](https://www.google.com/script/start/)
2. Create a new project
3. Copy and paste the code in outboundblock.gs.
4. Save it and run.
5. You'll be prompted to give permission. You'll likely get a big warning that it's unauthenticated. If it doesn't prompt you, try running it again. It's buggy.
6. After you run it, it'll likely show a "null" under the execution steps and not actually run it. Like we said, buggy. It should work when set up as a trigger, though.
7. Go to triggers on left, create a new trigger, and set up a time-based trigger for the `outboundblock` function. We recommend every hour, but if you would like it to check more often (like every 10 minutes, go ahead).

## Security notes

The big permissions warning you'll get when you go to save and run the code is due to this being a beta app script and not an official Gmail extension. We understand if this looks intense.

If it helps:

1. Feel free to review the code before you install. Ask ChatGPT what it does, if you're not an expert. As you'll see, there's no functionality to write or send or delete emails, only to read them and send a truncated version to Nyckel for classification. <i>So, even though Google says OutboundBlock has the ability to write or delete emails, we have no actual way to doing that.</i>
2. Once you install the script, Nyckel has no way to make edits to or access that code.
3. Nyckel does not store any API requests made to our platform. So, we have no access to your email content, even if we tried.

## How OutboundBlock works

The code:

1. Looks at unread emails that have come in in the past hour, and which aren't already starred, in sent, or in the MarketingBlock/OutboundBlock folders (see "Very First Run" for the one exception)
2. It also looks at the sender, subject, and body of the received emails. Within the code are specific phrases that, if found, will automatically block from sending to Nyckel and will instead keep it in the inbox. This is to prevent false positives (aka, important emails marked as spam).
3. It also cleans up and truncates the body text.
4. It then sends the subject and cleaned body to Nyckel, which will respond with the label Inbox, MarketingSpam, or OutboundSpam.
5. If the latter two, it will place it in the respective MarketingBlock or OutboundBlock folders (by attaching a label). It will also archive it so it is no longer in the inbox. If no such label exists, it will create one. It keeps it unread.

<img width="751" alt="Screenshot 2024-02-18 at 3 55 14 PM" src="https://github.com/NyckelAI/chris/assets/20774922/e44afd34-7f52-4565-a08a-12aa8a5be60d">

## How to block domains from being sent to Nyckel

At the script's top is a constant for defining any domains that will be ignored by the script (and not sent to Nyckel).

const IGNORED_DOMAINS = ['google', 'github', 'microsoft', 'linkedin', 'substack']; // Fixed domains to ignore

Feel free to add to this (or remove) if you would like to prevent any false positives from important domains (or to ensure they aren't sent to Nyckel).

Please note that your own domain will automatically be blocked by default, so you don't have to add it.

## Very first run

In the very first run, the script looks at any unread emails in the inbox (up to 500) from past 180 days. After that it only looks at unread emails received in the past hour.

## MarketingSpam vs OutboundSpam folders

The tool currently breaks these apart. OutboundSpam is your quintessential B2B spam, while MarketingSpam includes newsletters, sign-up follow-ups, and so on. 

We'd love your feedback on whether this split is needed. 

If you'd like to group them into one folder, you can update the below code:

`archiveAndLabelEmail(message, 'MarketingBlock');`

to 

`archiveAndLabelEmail(message, 'OutboundBlock');`

and 

`return archiveAndLabelEmail(message, 'MarketingBlock');`

to

`return archiveAndLabelEmail(message, 'OutboundBlock');`