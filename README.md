# OutboundBlock (Powered by Nyckel)

The purpose of [OutboundBlock](https://www.outboundblock.com) is identify and block unwanted B2B spam.

<img width="400" alt="Screenshot 2024-02-18 at 12 03 29 PM" src="https://www.outboundblock.com/images/outboundblock-example3.webp">

The current beta version is a Google App Script. You just need to add it to Google App Scripts, then set up a trigger to have it run every 30 minutes. 

The code is in outboundblock.gs. 

## Setting it up

1. Go to [App Scripts](https://www.google.com/script/start/)
2. Create a new project
3. Copy and paste the code found in outboundblock.gs.
4. Save it and run.
5. You'll be prompted to give permission. You'll likely get a big warning that it's unauthenticated. Click on "Advanced" and proceed through the warning.
6. After you run it, it'll likely show a "null" under the execution steps and not actually run it. Ignore this.
7. Go to triggers on left, create a new trigger, and set up a time-based trigger for the `outboundblock` function. We recommend every 30 minutes, but if you would like it to check more often (like every 10 minutes, go ahead).

## Security notes

The big permissions warning you'll get when you go to save and run the code is due to this being a beta app script and not an official Gmail extension.

1. Feel free to review the code before you install. As you'll see, there are no functions that write, send, or delete emails.
2. Nyckel has no access to this code once you add it.
3. Nyckel does not store API requests. No one at Nyckel can see your emails.

## How OutboundBlock works

1. Looks at unread emails that have come in in the past hour
2. Ignores emails that include certain hardcode phrases or domains
3. Sends the subject/body to Nyckel for classification
5. If Nyckel determines the email is spam, it will archive it from the inbox and move it to the MarketingSpam or OutboundSpam label. 

## How to block domains from being sent to Nyckel

At the script's top is a constant for defining any domains that will be ignored by the script (and not sent to Nyckel). Feel free to add to this (or remove).

`const IGNORED_DOMAINS = ['google', 'github', 'microsoft', 'linkedin', 'substack'];`

## Very first run

In the very first run, the script looks at any unread emails in the inbox (up to 500) from past 180 days. After that it only looks at unread emails received in the past hour.