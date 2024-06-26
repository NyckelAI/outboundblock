Want the instructions in Google Docs instead? Click [here](https://docs.google.com/document/d/1cfPO1h1FRfZT8wG2GcJIbmAY4a4HG-gWjHIfs7HVNxk/edit?usp=sharing).

# OutboundBlock (Powered by Nyckel)

The purpose of [OutboundBlock](https://www.outboundblock.com) is identify and block unwanted B2B spam. It uses a [Nyckel-created](https://www.nyckel.com/) text classification model.

<img width="760" alt="outboundblock" src="https://github.com/NyckelAI/outboundblock/assets/20774922/1298201c-0366-4b5c-bd96-1d613d2aeb87">

The current beta version is a [Google App Script](https://www.google.com/script/start/), a scripting tool that interacts with your Google Workspace apps. It's just copy/pasting, so you don't need technical experience to get going. 

The code is in [outboundblock.gs](https://github.com/NyckelAI/outboundblock/blob/master/outboundblock.gs).

## If updating to a newer version

If you are moving from an older version of OutboundBlock to a new one, please delete your current trigger and the current project. Then, re-follow the instructions below.

## Setting it up

1. Go to [App Scripts](https://www.google.com/script/start/).

2. Turn off any adblockers and enable pop ups for the page.

3. Create a new project. You can go to Editor on the left nav bar.

<img width="478" alt="Screenshot 2024-03-19 at 11 40 01 AM" src="https://github.com/NyckelAI/outboundblock/assets/20774922/81c19fc4-8c9d-4d3a-9eab-db6e73c54443">

4. Click on the plus sign and add a script.

<img width="419" alt="Screenshot 2024-03-19 at 11 40 43 AM" src="https://github.com/NyckelAI/outboundblock/assets/20774922/687cb188-f52a-4a63-a690-6d2e89707b85">

5. Remove the current code that's there.
   
6. Copy and paste the code found in [outboundblock.gs](https://github.com/NyckelAI/outboundblock/blob/master/outboundblock.gs). Give it a name like "OutboundBlock"
   
7. Save it.

8. Click on the down arrow next to Execution Log.

9. Select "GetUserDomain". Then press Run. If it gives you a "couldn't find myfunction" error, run it again. It will prompt you for authorization. After that, press Run again.

<img width="514" alt="Screenshot 2024-04-24 at 8 59 13 PM" src="https://github.com/NyckelAI/outboundblock/assets/20774922/325b7bc1-e41e-43e9-85ff-4f463618e4bb">

10. Next, you'll want to select "Outboundblock2" from the same list, press run, then give it authorization. 
    
<img width="797" alt="Screenshot 2024-04-23 at 2 14 12 PM" src="https://github.com/NyckelAI/outboundblock/assets/20774922/5fdafca6-59cc-40e5-88dd-83c59761deda">

11. If it doesn't automatically initiate the script, press Run again. It will run the script for the first time. Depending on your # of unread emails, this could take anywhere from 15s to 5 mins.
    
12. Now go to Triggers on the left nav bar, create a new trigger, and set up a time-based trigger for the `outboundblock2` function.  We recommend using the “minute” time period and setting it for every 15 minutes. The script will run 15 minutes after you turn the trigger on. Please note: do not set it for more often than every 15 minutes, as the script will hit run limits and start failing.

<img width="450" alt="Screenshot 2024-03-19 at 11 44 27 AM" src="https://github.com/NyckelAI/outboundblock/assets/20774922/0ec86bc9-64c9-4b11-bf96-9b597951ea84">

## Security / authentication notes

We understand if the permission warning is daunting, but that is the warning it gives for any third-party App Script, as none of them have gone through the Google Extension approval process. 

We recommend reviewing the code yourself to understand what exactly is does. As you'll see, the code looks at Gmail emails and sends them to Nyckel for classification. There is no logic for writing, sending, or deleting emails, nor any logic for interacting with Google Sheets, Docs, etc.

Some additional security notes:

1. Once you add the code, Nyckel has no access to it. There's no way for Nyckel to inject additional logic into your app script.
2. Nyckel does not store API requests. No one at Nyckel can see your emails.
3. The script, by default, ignores emails from people with the same domain as you. Meaning, your internal company emails will never be sent to Nyckel, providing an additional security layer.

## How OutboundBlock works

1. It looks at unread emails that have come in in the past hour.
2. It ignores emails that include certain hardcode phrases or domains, including any emails from people who work at your company.
3. It cleans up and sends the subject/body to Nyckel for classification.
4. If the model determines the email is spam, it will archive it from the inbox and move it to the B2BSpam label. It will remain unread. If that label don't exist, it will create them.

## How to ensure certain domains never get moved to spam

At the script's top is a constant for defining any domains that will be ignored by the script (and not sent to Nyckel). Feel free to add to this (or remove).

`const IGNORED_DOMAINS = ['google', 'github', 'microsoft', 'substack'];`

## Very first run

In the very first run, the script looks at any unread emails in the inbox (up to 100) from the past 30 days. After that it only looks at unread emails received in the past hour.

## Removing OutboundBlock

Deleting the trigger will stop OutboundBlock from running. You can also remove the code itself from the Editor view.
