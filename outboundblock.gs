// Nyckel Details
const FUNCTION_ID = 'fx5e8hh0cufihjhx'; //Nyckel Function ID
const NYCKEL_URL = `https://www.nyckel.com/v1/functions/${FUNCTION_ID}/invoke?capture=false`; //Nyckel Endpoint
const SUBJECT_NYCKEL = 'field_crkglijebrmnb1pr'; //Nyckel field ID for subject
const BODY_NYCKEL = 'field_pv6rcsod2g7h0hsm'; //Nyckel field ID for Body
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000; // Base delay of 1 second for exponential backoff
const LABEL_NAME = 'B2BSpam'

// Cleanups
const IGNORED_DOMAINS = ['google', 'github', 'microsoft', 'nyckel', 'substack']; // Fixed domains to ignore

// Search Criteria
const BASE_SEARCH_CRITERIA = 'label:inbox is:unread -label:starred -label:sent';
const FIRST_RUN_CRITERIA = 'newer_than:30d';
const SUBSEQUENT_RUN_CRITERIA = `newer_than:1h -label:${LABEL_NAME}`;
const EMAIL_LIMIT = 150; // Max number of emails to process in a run. Google max limit is 500.

// Starts logging
function log(message) {
  Logger.log(message);
}

// Extracts email address and domain from any email field
function extractEmailDetails(emailField) {
  const match = emailField.match(/<(.+?)>/) || [null, emailField.trim()];
  const email = match[1];
  const domain = email.substring(email.lastIndexOf("@") + 1).toLowerCase();
  return { email, domain };
}

// Function to extract the domain of the script's user
function getUserDomain() {
  const userEmail = Session.getActiveUser().getEmail();
  const userDomain = userEmail.split('@')[1];
  return userDomain;
}

function isFromIgnoredDomain(fromField, replyToField) {
    const userDomain = getUserDomain();
    const fromDetails = extractEmailDetails(fromField);
    const replyToDetails = replyToField ? extractEmailDetails(replyToField) : fromDetails;

    // Combine with fixed ignore list
    const allIgnoredDomains = IGNORED_DOMAINS.concat([userDomain]);

    // Check if both the 'from' and 'replyTo' or 'to' domains are in the ignored list
    if (allIgnoredDomains.includes(fromDetails.domain) && allIgnoredDomains.includes(replyToDetails.domain)) {
        return true;
    }

    // If the 'from' and 'replyTo' domains do not match, check if either domain should be processed
    if (fromDetails.domain !== replyToDetails.domain) {
        // If either domain is not on the ignore list, do not skip
        if (!allIgnoredDomains.includes(fromDetails.domain) || !allIgnoredDomains.includes(replyToDetails.domain)) {
            return false;
        }
    }

    return false;
}

// Helper to extract domain from an email address
function extractDomain(email) {
    return email.substring(email.lastIndexOf("@") + 1).toLowerCase();
}

// Ignores emails with below phrases in the body. Case insensitive.
function shouldIgnoreEmail(body) {
  const ignorePhrases = [
   'invitation from google calendar',
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
  const startsWithPhrases = ['your', 'action', 'password','accepted','new lead','new submission', 'thank you for'];
  const containsPhrases = [
    'security alert',
    'thank you for contacting',
    'recent activity',
    'unsubscribed',
    'been added',
    'booked a meeting',
    'verification',
    'activate your',
    'new login',
    'you have been made',
    'new device detected',
    'Out of Office',
    'OOO',
    'Recent activity',
    'upcoming meeting',
    'meeting reminder',
    'invited you',
    'reminder for our',
    'has invited you',
    '[action required]',
    'confirm your',
    'new log-in',
    'verify',
    'privacy policy',
    'ticket #',
    'update account',
    'email verified',
    'Activate Account',
    'Privacy Policy Update',
    'your receipt',
    'Updates to',
    'shared meeting notes',
    'Downgrade',
    'important updates',
    'confirm you',
    'order confirmation',
    'important update',
    'reset your password',
    'reset password',
    'action required',
    'new contact',
    'about to end',
    'Tax return document',
    'Tax document',
    'Payment confirmation',
    'Trip with uber',
    'Thank you for your order',
    'Receipt for',
    'paid today',
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
    'Just joined your',
    'Verification code',
    'Payment is scheduled',
    'New sign-in',
    'New sign in',
    'Please complete your',
    'updating our',
    'updated our',
    'alert',
    'Terms of Service',
    'Privacy Policy',
    'Demo request',
    'thanks for booking',
    'sign into',
    'sign in to',
    'cancelled',
    'canceled',
    'terminated',
    'Mentioned you',
    'In a comment',
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
    .replace(new RegExp(`https?:\\/\\/[^\s]{40,}`, 'g'), match => match.substring(0, 40) + '...')
    .replace(/-{3,}|= {3,}|\*{2,}|\.{4,}|\(\s*\)|[\u0080-\uFFFF]|&zwnj;/g, '')
    .replace(/(\r\n|\n|\r)/g, ' ')
    .replace(/ {2,}/g, ' ')

  // Apply truncation to body
  cleanedBody = cleanedBody.substring(0, 1400);

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
    case 'Inbox': // If the email is classified as Inbox
      // Check if any message in the thread already has "B2BSpam" label
      if (message.getThread().getLabels().some(label => label.getName() === LABEL_NAME)) {
        // Remove "B2BSpam" label from all messages in the thread
        message.getThread().getMessages().forEach(msg => {
          msg.removeLabel(LABEL_NAME);
        });
      }
      break;
    case 'OutboundSpam':
      archiveAndLabelEmail(message, LABEL_NAME);
      break;
    case 'MarketingSpam':
      archiveAndLabelEmail(message, LABEL_NAME);
      break;
    default:
      break;
  }
}

// Function to process threads based on label and query, and move them to inbox after removing the label
function processAndMoveThreads(query, labelName) {
  const threads = GmailApp.search(query);
  const label = GmailApp.getUserLabelByName(labelName);

  if (!label) {
    Logger.log('Label not found: ' + labelName);
    return 0; // Exit if label is not found
  }

  Logger.log('Processing threads for label: ' + labelName);
  threads.forEach(thread => {
    const subject = thread.getFirstMessageSubject(); // For logging purposes
    thread.moveToInbox();
    thread.removeLabel(label);
    Logger.log('Moved to inbox and removed label from thread: ' + subject);
  });

  return threads.length;
}


// Remove spam labels where you or a coworker are engaged on a thread
function handleEmailsBasedOnLabel() {
  const userDomain = getUserDomain();

  // Process for sent emails and from user's domain using LABEL_NAME
  let sentQuery = `in:sent label:${LABEL_NAME}`;
  let sentThreadsCount = processAndMoveThreads(sentQuery, LABEL_NAME);
  log(`Processed ${sentThreadsCount} threads for sent emails with search: ${sentQuery}`);

  let fromQuery = `from:${userDomain} label:${LABEL_NAME}`;
  let fromThreadsCount = processAndMoveThreads(fromQuery, LABEL_NAME);
  log(`Processed ${fromThreadsCount} threads for emails from domain ${userDomain} with search: ${fromQuery}`);
}

// Find threads with my emails and LABEL_NAME, remove label, and move to inbox
function findThreadsWithMyEmailAndLabel() {
  var maxResults = 10; // Maximum number of threads to process (adjust as needed)
  var threads = GmailApp.search('label:' + LABEL_NAME, 0, maxResults);

  threads.forEach(thread => {
    const messages = thread.getMessages();
    for (const message of messages) {
      var myEmail = Session.getActiveUser().getEmail();
      if (message.getFrom().indexOf(myEmail) >= 0) { // Checks if you are the sender
        Logger.log('Found thread: ' + thread.getFirstMessageSubject());
        thread.moveToInbox();
        if (GmailApp.getUserLabelByName(LABEL_NAME)) {
          thread.removeLabel(GmailApp.getUserLabelByName(LABEL_NAME));
        }
        break;
      }
    }
  });
}

// Gmail search operators
function setupSearchCriteria() {
    const scriptProperties = PropertiesService.getScriptProperties();
    let searchCriteria = BASE_SEARCH_CRITERIA;
    const firstRunFlag = scriptProperties.getProperty('firstRunCompleted');

    if (!firstRunFlag) {
        searchCriteria += ` ${FIRST_RUN_CRITERIA}`;
        scriptProperties.setProperty('firstRunCompleted', 'true');
        log("First run setup complete");
    } else {
        searchCriteria += ` ${SUBSEQUENT_RUN_CRITERIA}`;
        log("Not first run");
    }

    return searchCriteria;
}

// Archive message
function archiveAndLabelEmail(message, labelName) {
 var label = getOrCreateLabel(labelName);
 message.getThread().addLabel(label).moveToArchive();
}

// Add spam label
function labelEmail(message, labelName) {
 var label = getOrCreateLabel(labelName);
 message.getThread().addLabel(label);
}

// Label management
function getOrCreateLabel(labelName) {
  let label = GmailApp.getUserLabelByName(labelName);
  if (!label) label = GmailApp.createLabel(labelName);
  return label;
}

// Helper function to format dates for Gmail search
function formatDateForGmailSearch(date) {
  return Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy/MM/dd");
}

function handleEmailResponse(mostRecentMessage, subject, body) {
  if (!subject || !body) {
    archiveAndLabelEmail(mostRecentMessage, LABEL_NAME);
    log('Empty subject or body, email archived as ' + LABEL_NAME);
    return;
  }

  const payload = JSON.stringify({
    data: { [SUBJECT_NYCKEL]: subject, [BODY_NYCKEL]: body }
  });

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: payload,
    muteHttpExceptions: true
  };

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = UrlFetchApp.fetch(NYCKEL_URL, options);
      if (response.getResponseCode() === 200) {
        const responseText = response.getContentText();
        const responseData = safeJSONParse(responseText);
        if (responseData) {
          processEmailBasedOnClassification(mostRecentMessage, responseData);
          log(`Email processed based on classification: ${JSON.stringify(responseData)}`);
        } else {
          throw new Error('Invalid JSON response format');
        }
        break;
      } else {
        throw new Error(`API call failed with status ${response.getResponseCode()}: ${response.getContentText()}`);
      }
    } catch (e) {
      log(`Error during API interaction: ${e.message}. Attempt ${attempt + 1} of ${MAX_RETRIES}`);
      if (attempt === MAX_RETRIES - 1) {
        archiveAndLabelEmail(mostRecentMessage, LABEL_NAME);
        log('Max retries reached, email archived as spam');
      } else {
        Utilities.sleep(Math.pow(2, attempt) * BASE_DELAY_MS);
      }
    }
  }
}

function safeJSONParse(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    log(`Failed to parse JSON: ${e.message}`);
    return null;
  }
}

function outboundblock2() {
    log("Starting email classification process.");
    const searchCriteria = setupSearchCriteria();
    const threads = GmailApp.search(searchCriteria, 0, EMAIL_LIMIT);
    log(`Found ${threads.length} threads to process based on criteria: ${searchCriteria}`);

    threads.forEach((thread, index) => {
        log(`Processing thread ${index + 1} of ${threads.length}`);
        const messages = thread.getMessages();
        const mostRecentMessage = messages[messages.length - 1];
        
        // Using the new extractEmailDetails function for 'From' and 'Reply-To'
        const fromDetails = extractEmailDetails(mostRecentMessage.getFrom());
        const replyToDetails = mostRecentMessage.getReplyTo() ? extractEmailDetails(mostRecentMessage.getReplyTo()) : fromDetails;
        const subject = mostRecentMessage.getSubject().toLowerCase();
        const body = mostRecentMessage.getPlainBody().toLowerCase();

        // Auto-block app script failure notifications
        if (subject.includes('summary of failures for google apps script')) {
            log(`auto-moving to spam since it is google app script failure.`);
            archiveAndLabelEmail(mostRecentMessage, LABEL_NAME);
            return;  // Skip further processing
        }

        // Checking domain exclusions
        if (isFromIgnoredDomain(fromDetails.email, replyToDetails.email)) {
            log(`Skipping email with subject "${subject}" as it is internal communication.`);
            return;  // Skip further processing
        } else {
            log(`Processing email with subject "${subject}" due to domain mismatch or external communication.`);
            // Your code to handle the response, such as sending it to the Nyckel API
        }

        // Checking body exclusions
        if (shouldIgnoreEmail(body).shouldIgnore) {
            log(`Skipping email with subject "${subject}" due to ignored content in body.`);
            return;  // Skip further processing
        }

        // Checking subject exclusions
        if (shouldIgnoreSubject(subject).shouldIgnore) {
            log(`Skipping email with subject "${subject}" due to ignored content in subject.`);
            return;  // Skip further processing
        }

        // Cleanup body and handle response
        const cleanedBody = cleanUpBodyText(body);
        handleEmailResponse(mostRecentMessage, subject, cleanedBody);
    });

    log("Reviewing sent folders for responses");
    handleEmailsBasedOnLabel();
    log("Reviewing spam folder for responses");
    findThreadsWithMyEmailAndLabel();

    log("Finished email classification process.");
}
