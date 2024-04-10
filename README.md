Want the instructions in Google Docs instead? Click [here](https://docs.google.com/document/d/1cfPO1h1FRfZT8wG2GcJIbmAY4a4HG-gWjHIfs7HVNxk/edit?usp=sharing).

# OutboundBlock (Powered by Nyckel)

The purpose of [OutboundBlock](https://www.outboundblock.com) is identify and block unwanted B2B spam. It uses a [Nyckel-created](https://www.nyckel.com/) text classification model.

<img width="400" alt="Screenshot 2024-02-18 at 12 03 29 PM" src="https://www.outboundblock.com/images/outboundblock-example3.webp">

The current beta version is a [Google App Script](https://www.google.com/script/start/), a scripting tool that interacts with your Google Workspace apps. It's just copy/pasting, so you don't need technical experience to get going. 

The code is in [outboundblock.gs](https://github.com/NyckelAI/outboundblock/blob/master/outboundblock.gs).

## Setting it up

1. Go to [App Scripts](https://www.google.com/script/start/).
2. Create a new project. You can go to Editor on the left nav bar.

<img width="478" alt="Screenshot 2024-03-19 at 11 40 01 AM" src="https://github.com/NyckelAI/outboundblock/assets/20774922/81c19fc4-8c9d-4d3a-9eab-db6e73c54443">

3. Click on the plus sign and add a script.

<img width="419" alt="Screenshot 2024-03-19 at 11 40 43 AM" src="https://github.com/NyckelAI/outboundblock/assets/20774922/687cb188-f52a-4a63-a690-6d2e89707b85">

4. Remove the current code that's there.
5. Copy and paste the code found in [outboundblock.gs](https://github.com/NyckelAI/outboundblock/blob/master/outboundblock.gs). Give it a name like "OutboundBlock".
6. Save it and run. If you get a red error warning around "couldn't find myfunction", run it again.
7. You'll be prompted to give permission, and you'll get a big warning that it's unauthenticated. Click on "Advanced" and proceed through the warning (see notes below - it's a blanket warning for an App Script and the tool doesn't actually do what it warns again). If this doesn't work, enable pop-ups in your browser and try again.
8. After you run it, it'll likely show a "null" under the execution steps. Ignore that - it'll work once triggered below.
9. Now go to Triggers on the left nav bar, create a new trigger, and set up a time-based trigger for the `outboundblock` function.  We recommend using the “minute” time period and setting it for every 30 minutes. The script will run in 30 minutes after you turn the trigger on (or however many minutes you set).

<img width="450" alt="Screenshot 2024-03-19 at 11 44 27 AM" src="https://github.com/NyckelAI/outboundblock/assets/20774922/0ec86bc9-64c9-4b11-bf96-9b597951ea84">

## Security / authentication notes

We understand if the permission warning is daunting, but that is the warning it gives for any third-party App Script, as none of them have gone through the Google Extension approval process. 

We recommend reviewing the code yourself to understand what exactly is does. As you'll see, the code looks at Gmail emails and sends them to Nyckel for classification. There is no logic for writing, sending, or deleting emails, nor any logic for interacting with Google Sheets, Docs, etc.

Some additional security notes:

1. Once you add the code, Nyckel has no access to it. There's no way for Nyckel to inject additional logic into your app script.
2. Nyckel does not store API requests. No one at Nyckel can see your emails.
3. The script, by default, ignores emails from people with the same domain as you. Meaning, your internal company emails will never be sent to Nyckel, providing an additional security layer.

## Auth Issues

If you run into any errors involving authentication, such as:

<img width="865" alt="Screenshot 2024-04-06 at 1 31 45 PM" src="https://github.com/NyckelAI/outboundblock/assets/20774922/6c70efec-29c1-4771-9c27-ef6fef473ead">

Then you can manually add the auth scopes yourself. To do that:

1. Go to Project Settings (the gear icon on left)
2. Click on "Show "appsscript.json" manifest file in editor"
3. Return to Editor and click on "appscript.json".
4. Replace it with the below code, which outlines the scopes needed.

```
{
  "timeZone": "America/New_York",
  "oauthScopes": [
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/script.external_request"
  ],
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8"
}
```

If that doesn't work, try deleting the script and re-adding it. It could have been a bug during the authentication process. Check your browser to ensure pop-ups aren't being blocked.

<img width="915" alt="Screenshot 2024-04-06 at 1 21 11 PM" src="https://github.com/NyckelAI/outboundblock/assets/20774922/de6e1af5-d1ce-4696-bcae-e9d0b0d57a9c">

<img width="632" alt="Screenshot 2024-04-06 at 1 17 28 PM" src="https://github.com/NyckelAI/outboundblock/assets/20774922/1d3dea38-f783-41f3-926b-f1d718e2bb1d">

## How OutboundBlock works

1. It looks at unread emails that have come in in the past hour.
2. It ignores emails that include certain hardcode phrases or domains.
3. It cleans up and sends the subject/body to Nyckel for classification.
4. If the text model determines the email is spam, it will archive it from the inbox and move it to the B2BSpam label. It will remain unread. If those labels don't exist, it will create them.

## How to block domains from being sent to Nyckel

At the script's top is a constant for defining any domains that will be ignored by the script (and not sent to Nyckel). Feel free to add to this (or remove).

`const IGNORED_DOMAINS = ['google', 'github', 'microsoft', 'linkedin', 'substack'];`

## Very first run

In the very first run, the script looks at any unread emails in the inbox (up to 500) from the past 90 days. After that it only looks at unread emails received in the past hour.

## Removing OutboundBlock

Deleting the trigger will stop OutboundBlock from running.
