# OutboundBlock (Powered by Nyckel)

The purpose of [OutboundBlock](https://www.outboundblock.com) is identify and block unwanted B2B spam. It uses a [Nyckel-created](https://www.nyckel.com/) text classification model.

<img width="400" alt="Screenshot 2024-02-18 at 12 03 29 PM" src="https://www.outboundblock.com/images/outboundblock-example3.webp">

The current beta version is a [Google App Script](https://www.google.com/script/start/), a scripting tool that interacts with your Google Workspace apps. It's just copy/pasting, so you don't need technical experience to get going. 

The code is in [outboundblock.gs](https://github.com/NyckelAI/outboundblock/blob/master/outboundblock.gs).

## Setting it up

1. Go to [App Scripts](https://www.google.com/script/start/)
2. Create a new project
3. Remove the current code that's there.
4. Copy and paste the code found in [outboundblock.gs](https://github.com/NyckelAI/outboundblock/blob/master/outboundblock.gs). Give it a name like "OutboundBlock".
5. Save it and run.
6. You'll be prompted to give permission, and you'll get a big warning that it's unauthenticated. Click on "Advanced" and proceed through the warning (see notes below about that). If it doesn't work, enables pop-ups in your browser and try again.
7. After you run it, it'll likely show a "null" under the execution steps. Ignore that - it'll work once triggered below.
8. Now go to Triggers on the left nav bar, create a new trigger, and set up a time-based trigger for the `Outboundblock` function. We recommend every 30 minutes, but if you would like it to check more often (like every 10 minutes, go ahead).

<img width="422" alt="Screenshot 2024-03-19 at 11 22 22 AM" src="https://github.com/NyckelAI/outboundblock/assets/20774922/4cc20b4b-f490-46c0-ae11-b4de5e5c1d17">

## Security / authentication notes

We understand if the permission warning is daunting, but that is the warning it gives for any third-party App Script, as none of them have gone through the Google Extension approval process. 

We recommend reviewing the code yourself to understand what exactly is does. As you'll see, the code looks at Gmail emails and sends them to Nyckel for classification. There is no logic for writing, sending, or deleting emails, nor any logic for interacting with Google Sheets, Docs, etc.

Some additional security notes:

1. Once you add the code, Nyckel has no access to it. There's no way for Nyckel to inject additional logic into your app script.
2. Nyckel does not store API requests. No one at Nyckel can see your emails.
3. The script, by default, ignores emails from people with the same domain as you. Meaning, your internal company emails will never be sent to Nyckel, providing an additional security layer.

## How OutboundBlock works

1. It looks at unread emails that have come in in the past hour.
2. It ignores emails that include certain hardcode phrases or domains.
3. It cleans up and sends the subject/body to Nyckel for classification.
4. If the text model determines the email is spam, it will archive it from the inbox and move it to the MarketingSpam or OutboundSpam label. It will remain unread.

## MarketingBlock vs OutboundBlock

By default the script breaks these apart, with OutboundBlock refering to spammy 1:1 sales outbound emails, and MarketingBlock being focused more on 1:many marketing newsletters. We'd love feedback to understand if this bifurcation is needed, or if we should just combine them into one spam folder.

## How to block domains from being sent to Nyckel

At the script's top is a constant for defining any domains that will be ignored by the script (and not sent to Nyckel). Feel free to add to this (or remove).

`const IGNORED_DOMAINS = ['google', 'github', 'microsoft', 'linkedin', 'substack'];`

## Very first run

In the very first run, the script looks at any unread emails in the inbox (up to 500) from the past 180 days. After that it only looks at unread emails received in the past hour.
