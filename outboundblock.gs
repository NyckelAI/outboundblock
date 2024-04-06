// Constants
const FUNCTION_ID = 'fx5e8hh0cufihjhx'; //Nyckel Function ID
const NYCKEL_URL = `https://www.nyckel.com/v1/functions/${FUNCTION_ID}/invoke?capture=false`; //Nyckel Endpoint
const HOUR_CHECK = 8; // Looks at just emails received in the past {{X}} hour(s)
const SUBJECT_NYCKEL = 'field_crkglijebrmnb1pr'; //Nyckel field ID for subject
const BODY_NYCKEL = 'field_pv6rcsod2g7h0hsm'; //Nyckel field ID for Body
const IGNORED_DOMAINS = ['google', 'github', 'microsoft', 'linkedin', 'substack']; // Fixed domains to ignore
const URL_TRUNCATION_LIMIT = 40; //Character limit for URLs
const BODY_TRUNCATION_LIMIT = 1400; // Charcter limit for body text
const EMAIL_LIMIT = 500; // Max number of emails to process in a run. Google max limit is 500.
const BASE_SEARCH_CRITERIA = 'label:inbox is:unread -label:starred -label:sent'; //Default search across both first run and subsequent ones
const FIRST_RUN_TIMEFRAME_DAYS = 90; // For first run, # of days to process emails for.
const SUBSEQUENT_RUN_CRITERIA = '-label:MarketingSpam -label:B2BSpam'; //After first run, the additional rules to look for
const TIME_AGO = new Date(new Date().getTime() - (HOUR_CHECK * 60 * 60 * 1000)); // time constant for subsequent runs. Doesn't need changed

// Starts logging
function log(message) {
  Logger.log(message);
}

// Pulls email domain
function extractEmailAddress(fromField) {
  const match = fromField.match(/<(.+?)>/);
  return match ? match[1] : fromField.trim();
}

// Pulls 'Reply-To' email address. This is to catch people pretending to be sending the email from your domain, but the reply to is different.
function extractReplyToAddress(replyToField) {
  const match = replyToField ? replyToField.match(/<(.+?)>/) : null;
  return match ? match[1] : replyToField;
}

// Function to extract the domain of the script's user
function getUserDomain() {
  const userEmail = Session.getActiveUser().getEmail(); // Gets the email address of the person running the script
  const userDomain = userEmail.split('@')[1]; // Splits the email address by '@' and takes the second part, which is the domain
  return userDomain;
}

// Ignores emails with specific domains
function isFromIgnoredDomain(fromField) {
  return IGNORED_DOMAINS.some(domain => fromField.toLowerCase().includes(domain));
}

// Ignores emails with below phrases in the body. Case insensitive.
function shouldIgnoreEmail(body) {
  const ignorePhrases = [
   'invitation from google calendar:',
   'microsoft teams meeting',
   'mentioned you in a comment',
   'this transactional email',
   'has invited you',
   'verification code',
   'join with google meet',
   'confirm your account',
   'to activate',
   'microsoft teams web conference',
   'thanks for taking the time',
   'thank you for your payment',
   'we have received your request',
   'thanks for chatting',
   'thanks for taking the time',
   'thanks for the chat',
   'thanks again for',
   'nice to meet you',
   'free tier limit',
   'you are receiving this email because you are subscribed to calendar notifications'
  ];
  return shouldIgnore(body, ignorePhrases);
}

// Ignores emails with below phrases in the subject. Can define whether word starts or is in it at all. Case insensitive.
function shouldIgnoreSubject(subject) {
  const startsWithPhrases = ['your', 'action', 'password','accepted','new lead','new submission'];
  const containsPhrases = [
    'security alert',
    'thank you for contacting',
    'recent activity',
    'unsubscribed',
    'has been added',
    'canceled',
    'booked a meeting',
    'verification',
    'activate your',
    'new login',
    'new device detected',
    '[alert]',
    'Out of Office',
    'OOO',
    'Recent activity',
    'upcoming meeting',
    'Your ride with',
    'meeting reminder',
    'invited you',
    'reminder for our',
    'has invited you',
    '[action required]',
    'confirm your',
    'new log-in',
    'verification code',
    'verify',
    'privacy policy',
    'ticket #',
    'update account',
    'email verified',
    'updates to our',
    'Activate Account',
    'Privacy Policy Update',
    'your receipt',
    'Updates to',
    'shared meeting notes',
    'is Cancelled',
    'Downgrade',
    'important updates',
    'confirm you',
    'order confirmation',
    'important update',
    'reset your password',
    'reset password',
    'action required',
    'verify your email',
    'new contact',
    'about to end',
    'new lead',
    'Tax return document',
    'Tax document',
    'Payment confirmation',
    'Receipt for confirmation',
    'Trip with uber',
    'Thank you for your order',
    'Receipt for your payment',
    'Getting paid today',
    'Got paid today',
    'tax form',
    'Changes made to your account',
    'Unknown device',
    'Has expired',
    '1099',
    'You have unsubscribed',
    'Online order receipt',
    'About to renew',
    'Ready to renew',
    'Amazon order',
    'Reset your password',
    'Just joined your',
    'Your payment',
    'Password has been changed',
    'Verification code',
    'Payment is scheduled',
    'New sign-in',
    'New sign in',
    'Please complete your',
    'Updated our privacy',
    'We’re updating our',
    'We’ve updated our',
    'alert',
    'Terms of Service',
    'Privacy Policy',
    'Demo request',
    'thanks for booking',
    'sign into',
    'sign in to',
    'updating our terms',
    'cancelled',
    'canceled',
    'terminated',
    'Mentioned you',
    'In a comment',
    'Verify your',
    'About to expire',
  ];

  const subjectLC = subject.toLowerCase();

  // Check if the subject starts with any of the specified phrases
  const isStartsWithIgnore = startsWithPhrases.some(phrase => subjectLC.startsWith(phrase));
  if (isStartsWithIgnore) {
    return { shouldIgnore: true, phrase: "Starts with ignore phrase" };
  }

  // Check if the subject contains any of the specified phrases
  const isContainsIgnore = containsPhrases.some(phrase => subjectLC.includes(phrase));
  if (isContainsIgnore) {
    return { shouldIgnore: true, phrase: "Contains ignore phrase" };
  }

  // If none of the conditions are met, do not ignore the email
  return { shouldIgnore: false, phrase: "" };
}


// Helper function to perform ignore checks
function shouldIgnore(content, phrases) {
  const foundPhrase = phrases.find(phrase => content.toLowerCase().includes(phrase));
  return { shouldIgnore: !!foundPhrase, phrase: foundPhrase || '' };
}

// Cleans up body text before sending it to Nyckel
function cleanUpBodyText(body) {
  let cleanedBody = body
    .replace(/\b(https?:\/\/[^\s]+?)\?.*?\b/g, '$1')
    .replace(/\b(https?:\/\/[^\s]+?)=.*\b/g, '$1')
    .replace(new RegExp(`https?:\\/\\/[^\s]{${URL_TRUNCATION_LIMIT},}`, 'g'), match => match.substring(0, URL_TRUNCATION_LIMIT) + '...')
    .replace(/-{3,}|= {3,}|\*{2,}|\.{4,}|\(\s*\)|[\u0080-\uFFFF]|&zwnj;/g, '')
    .replace(/(\r\n|\n|\r)/g, ' ')
    .replace(/ {2,}/g, ' ')

  // Log the length after cleanup and before truncating
  log(`Body length after cleanup and before truncation: ${cleanedBody.length}`);

  // Apply truncation to BODY_TRUNCATION_LIMIT characters
  cleanedBody = cleanedBody.substring(0, BODY_TRUNCATION_LIMIT);

  // Log the length after truncation
  log(`Body length after truncation: ${cleanedBody.length}`);

  return decodeHtmlEntities(cleanedBody).trim();
}

// Decodes HTML entities to clean up text
function decodeHtmlEntities(text) {
  return text.replace(/&(#(\d+)|[a-zA-Z]+);/g, (match, capture, charCode) => {
    return charCode ? String.fromCharCode(charCode) : {
      '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'"
    }[match] || match;
  });
}

// Handling of Nyckel Response and assigning labels
function processEmailBasedOnClassification(message, classification) {
  switch (classification.labelName) {
    case 'OutboundSpam':
      archiveAndLabelEmail(message, 'B2BSpam');
      break;
    case 'MarketingSpam':
      archiveAndLabelEmail(message, 'B2BSpam');
      break;
    default:
      // Handle other cases or do nothing
      break;
  }
}

// Function to move an email back to the inbox and remove a specific label
function moveToInboxAndRemoveLabel(message, labelName) {
  const thread = message.getThread();
  const label = GmailApp.getUserLabelByName(labelName);
  // Move the thread back to the inbox
  thread.moveToInbox();
  // Remove the label if it exists
  if (label) {
    thread.removeLabel(label);
  }
}

function moveToInboxIfReplied() {
  const spamLabels = ['B2BSpam', 'MarketingSpam'];
  spamLabels.forEach(label => {
    // Search for sent emails that are also in one of the spam labels
    const query = `in:sent label:${label}`;
    const threads = GmailApp.search(query);
    
    threads.forEach(thread => {
      const messages = thread.getMessages();
      messages.forEach(message => {
        // Assuming we wish to move the entire thread if any message matches
        moveToInboxAndRemoveLabel(message, label);
      });
    });
  });

  Logger.log('Completed checking sent emails in B2BSpam and MarketingSpam labels.');
}

function moveToInboxAndRemoveLabel(message, labelName) {
  const thread = message.getThread();
  const label = GmailApp.getUserLabelByName(labelName);
  // Move the thread back to the inbox
  thread.moveToInbox();
  // Remove the label if it exists
  if (label) {
    thread.removeLabel(label);
  }
}

function removeSpamLabelAndMoveToInboxForUserDomain() {
  const userDomain = getUserDomain(); // Use the existing function to get the domain
  const spamLabels = ['B2BSpam', 'MarketingSpam']; // Spam labels to check against

  spamLabels.forEach(label => {
    // Generate the query using the user's domain and current label
    const query = `from:${userDomain} label:${label}`;
    const threads = GmailApp.search(query);

    threads.forEach(thread => {
      const messages = thread.getMessages();
      messages.forEach(message => {
        // Move each message in the thread back to the inbox and remove the spam label
        moveToInboxAndRemoveLabel(message, label);
      });
    });
  });

  Logger.log(`Completed removing spam labels for emails from domain: ${userDomain} and moving them to inbox.`);
}

// Label management
function getOrCreateLabel(labelName) {
  let label = GmailApp.getUserLabelByName(labelName);
  if (!label) label = GmailApp.createLabel(labelName);
  return label;
}

// Function to extract the domain of the script's user
function getUserDomain() {
  const userEmail = Session.getActiveUser().getEmail(); // Gets the email address of the person running the script
  const userDomain = userEmail.split('@')[1]; // Splits the email address by '@' and takes the second part
  return userDomain;
}

function outboundblock() {
  log("Starting email classification process.");

  const scriptProperties = PropertiesService.getScriptProperties();
  let firstRunFlag = scriptProperties.getProperty('firstRunCompleted');

  log("First run flag (before check/set): " + (firstRunFlag === null ? "null (will set now)" : firstRunFlag));

  let searchCriteria = BASE_SEARCH_CRITERIA;

  if (!firstRunFlag) {
    const firstRunTimeFrame = new Date(new Date().getTime() - (FIRST_RUN_TIMEFRAME_DAYS * 24 * 60 * 60 * 1000));
    searchCriteria += ` after:${formatDateForGmailSearch(firstRunTimeFrame)}`;
    scriptProperties.setProperty('firstRunCompleted', 'true');
    firstRunFlag = scriptProperties.getProperty('firstRunCompleted');
    log("First run flag (immediately after setting): " + firstRunFlag);
  } else {
    searchCriteria += ` ${SUBSEQUENT_RUN_CRITERIA}`;
    log("Running with subsequent run criteria.");
  }

  const threads = GmailApp.search(searchCriteria, 0, EMAIL_LIMIT);
  log(`Found ${threads.length} threads to process.`);

  threads.forEach((thread, index) => {
    log(`Processing thread ${index + 1} of ${threads.length}`);
    thread.getMessages().forEach(message => {
      const from = extractEmailAddress(message.getFrom());
      const subject = message.getSubject().toLowerCase();
      const body = message.getPlainBody().toLowerCase();

      if (message.getDate() < TIME_AGO) {
        return log(`Skipping email with subject "${subject}" because it was not received in the last hour.`);
      }

      if (isFromIgnoredDomain(from) || shouldIgnoreEmail(body).shouldIgnore || shouldIgnoreSubject(subject).shouldIgnore) {
        return log(`Skipping email from ${from} due to ignored content or domain.`);
      }
     
      const cleanedBody = cleanUpBodyText(body);
      if (!subject || !cleanedBody) {
        return archiveAndLabelEmail(message, 'B2BSpam');
      }

      try {
        const response = UrlFetchApp.fetch(NYCKEL_URL, {
          method: 'post',
          contentType: 'application/json',
          payload: JSON.stringify({
            "data": {
              [SUBJECT_NYCKEL]: subject,
              [BODY_NYCKEL]: cleanedBody
            }
          }),
          muteHttpExceptions: true
        });

        // Log the status code and response body
        log(`Nyckel API Response Status: ${response.getResponseCode()}`);
        log(`Nyckel API Response Body: ${response.getContentText()}`);

        if (response.getResponseCode() === 200) {
          const responseData = JSON.parse(response.getContentText());
          // Correct placement of processEmailBasedOnClassification call
          processEmailBasedOnClassification(message, responseData, from);
          log(`Successfully processed email: Subject = "${subject}"`);
        } else {
          log(`Error fetching classification: ${response.getContentText()}`);
        }
      } catch (e) {
        log(`Exception during API call: ${e.toString()}`);
      }
    });
  });

  // New line to call the function after processing
  moveToInboxIfReplied();

  // Call the new function here to run after checking the sent folder
  removeSpamLabelAndMoveToInboxForUserDomain();

  log("Finished email classification process.");
}


function archiveAndLabelEmail(message, labelName) {
 var label = getOrCreateLabel(labelName);
 message.getThread().addLabel(label).moveToArchive();
}


function labelEmail(message, labelName) {
 var label = getOrCreateLabel(labelName);
 message.getThread().addLabel(label);
}


function getOrCreateLabel(labelName) {
 var label = GmailApp.getUserLabelByName(labelName);
 if (!label) {
   label = GmailApp.createLabel(labelName);
 }
 return label;
}

// Helper function to format dates for Gmail search
function formatDateForGmailSearch(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy/MM/dd");
}
