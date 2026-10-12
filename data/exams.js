// Timed exams: one per subject, 36 questions mixed from every module type (multiple choice,
// fill in the blank, put in order, match pairs) across weeks 1 to 7. Sample content for the
// prototype. The first option / first step / first pair is the right one: the screen
// shuffles what the student sees, so the order here never leaks.
import { SUBJECTS } from './courses';

const M = (text, right, wrong, topic) => ({ type: 'mcq', text, options: [right, ...wrong], topic });
const B = (text, right, wrong, topic) => ({ type: 'blank', text, options: [right, ...wrong], topic });
const O = (text, steps, topic) => ({ type: 'order', text, steps, topic });
const T = (text, pairs, topic) => ({ type: 'match', text, pairs, topic });

export const EXAM_MINUTES = 45;
export const EXAM_QUESTIONS = 36;

const BANKS = {
  a: [
    M('Which part of communication carries the message from sender to receiver?', 'The channel', ['The noise', 'The feedback', 'The context'], 'Communication process'),
    M('What is feedback?', "The receiver's response", ['Background noise', 'The message itself', 'The medium used'], 'Communication process'),
    M('Which is an example of noise?', 'A loud building site during a call', ['A clear subject line', 'A short agenda', 'A confirmed meeting time'], 'Communication barriers'),
    M('A message is encoded when the sender...', 'Puts the idea into words or symbols', ['Reads the reply', 'Chooses the room', 'Records the meeting'], 'Communication process'),
    M('Which sentence is in the simple past tense?', 'He called you.', ['He is calling you.', 'He will call you.', 'He has called you.'], 'Tenses & agreement'),
    M('Which sentence agrees in number?', 'The reports were sent on Friday.', ['The reports was sent on Friday.', 'The report were sent on Friday.', 'The report are sent on Friday.'], 'Tenses & agreement'),
    M('Which sentence is in the active voice?', 'The manager approved the plan.', ['The plan was approved by the manager.', 'The plan has been approved.', 'Approval was given.'], 'Tenses & agreement'),
    M('Which tone suits a first email to a senior client?', 'Polite and clear', ['Casual and joking', 'Very short and blunt', 'Full of slang'], 'Writing for the reader'),
    M('A good subject line...', 'Says the point of the email', ['Repeats "Hello"', 'Is left blank', 'Lists every detail'], 'Writing for the reader'),
    M('What goes in the first line of a request email?', 'What you need from the reader', ['Your life story', 'A long apology', 'The signature'], 'Writing for the reader'),
    M('A thesis statement...', "States the essay's main argument", ['Lists the references', 'Ends the essay', 'Thanks the reader'], 'Essay writing'),
    M('Each paragraph in an essay should...', 'Focus on one main idea', ['Cover every idea', 'Repeat the introduction', 'Contain only quotes'], 'Essay writing'),
    M('Where does the conclusion belong?', 'At the end', ['At the start', 'In the middle', 'In the footnotes'], 'Essay writing'),
    M('An executive summary is...', 'A short overview at the top of a report', ['The reference list', 'The appendix', 'The cover page'], 'Reports and resumes'),
    M('What belongs at the top of a resume?', 'Your name and contact details', ['Your hobbies', 'A photo of your pet', 'A long personal essay'], 'Reports and resumes'),
    M("A report's recommendations answer...", 'What should be done next', ['Who wrote the report', 'Where it was printed', 'How long it took'], 'Reports and resumes'),
    M('The best way to open a presentation is to...', 'Lead with the main point', ['Apologise for nerves', 'Read every slide', 'Start with a long story'], 'Presentations'),
    M('Slides work best when they...', 'Support what you say', ['Repeat every word you say', 'Hold paragraphs of text', 'Use tiny fonts'], 'Presentations'),
    M('If you are cut off after 30 seconds, your opening should...', 'Still land the key message', ['Hide the point until the end', 'Be a joke only', 'Skip the audience'], 'Presentations'),
    M('Active listening includes...', 'Paraphrasing what you heard', ['Planning your reply while they talk', 'Checking your phone', 'Interrupting early'], 'Listening and meetings'),
    M('Meeting minutes record...', 'Decisions and next steps', ["Everyone's lunch order", 'Jokes told', 'Parking details'], 'Listening and meetings'),
    B('Yesterday, the manager ____ the report to the board.', 'sent', ['sends', 'will send', 'sending'], 'Tenses & agreement'),
    B('The ____ is the person who receives the message.', 'receiver', ['sender', 'channel', 'noise'], 'Communication process'),
    B('Lead with the main ____ in the first thirty seconds.', 'point', ['joke', 'apology', 'slide'], 'Presentations'),
    B('A ____ states the main argument of an essay.', 'thesis', ['footnote', 'title page', 'caption'], 'Essay writing'),
    B('An email should be written for the ____, not the writer.', 'reader', ['printer', 'server', 'archive'], 'Writing for the reader'),
    B('A short overview at the top of a report is the executive ____.', 'summary', ['index', 'appendix', 'cover'], 'Reports and resumes'),
    O('Put the parts of a board update in order.', ['Lead with the main result', 'Say what it means for them', 'Give the key numbers', 'Ask for the decision'], 'Presentations'),
    O('Put the parts of a clear email in order.', ['A subject line that says the point', 'What you need, in the first line', 'The details they need', 'The next step and the date'], 'Writing for the reader'),
    O('Put the steps of the communication process in order.', ['Sender has an idea', 'Sender encodes the message', 'Channel carries it', 'Receiver gives feedback'], 'Communication process'),
    O('Put the parts of an essay in order.', ['Introduction with a thesis', 'Body paragraphs', 'Counter-argument', 'Conclusion'], 'Essay writing'),
    T('Match each term to its meaning.', [['Sender', 'Starts the message'], ['Receiver', 'Gets the message'], ['Feedback', "The receiver's response"]], 'Communication process'),
    T('Match each part to its job.', [['Subject line', 'Says the point up front'], ['Greeting', 'Opens politely'], ['Sign-off', 'Closes with the next step']], 'Writing for the reader'),
    T('Match each tense to its use.', [['Simple past', 'A finished action'], ['Present continuous', 'Happening now'], ['Simple future', 'Has not happened yet']], 'Tenses & agreement'),
    T('Match each report part to its content.', [['Executive summary', 'The whole story in brief'], ['Findings', 'What the data showed'], ['Recommendations', 'What to do next']], 'Reports and resumes'),
    T('Match each presentation part to its aim.', [['Opening', 'Land the main point'], ['Body', 'Back it with evidence'], ['Close', 'Say what you need']], 'Presentations'),
  ],
  b: [
    M('Marketing is mainly about...', 'Creating value for customers', ['Printing posters', 'Cutting every cost', 'Hiring more staff'], 'What marketing is'),
    M('Which is a customer need?', 'Getting to work on time', ['A red sports car', 'A premium logo', 'A TV advert'], 'What marketing is'),
    M('A want differs from a need because it...', 'Is shaped by taste and culture', ['Is always cheaper', 'Cannot be sold', 'Is never felt'], 'What marketing is'),
    M('Which P deals with discounts and list price?', 'Price', ['Product', 'Place', 'Promotion'], 'The marketing mix'),
    M('Which P is about where customers can buy?', 'Place', ['Price', 'Product', 'Promotion'], 'The marketing mix'),
    M('An advert on TV belongs to which P?', 'Promotion', ['Product', 'Price', 'Place'], 'The marketing mix'),
    M('A target market is...', 'The group a brand chooses to serve', ['Everyone', 'Only existing customers', 'A competitor'], 'Segmentation'),
    M('Segmenting by age and income is...', 'Demographic segmentation', ['Behavioural segmentation', 'Geographic segmentation', 'Random sampling'], 'Segmentation'),
    M('Why segment a market?', 'To serve groups with different needs well', ['To avoid customers', 'To raise every price', 'To hide the brand'], 'Segmentation'),
    M('Positioning is...', 'The place a brand holds in the buyer\'s mind', ['The shop address', 'The price list', 'The factory location'], 'Positioning'),
    M('A clear positioning statement says...', 'Who it is for and why it is different', ['Only the price', 'Only the logo', 'Only the founder name'], 'Positioning'),
    M('Which brand is positioned on low price?', 'A discount supermarket', ['A luxury watchmaker', 'A boutique hotel', 'A private jet firm'], 'Positioning'),
    M('Cost-plus pricing sets price by...', 'Adding a margin to cost', ['Copying a rival', 'Asking friends', 'Guessing'], 'Pricing'),
    M('Premium pricing works when...', 'Buyers see higher value', ['The product is the cheapest', 'Nobody knows the brand', 'Costs are zero'], 'Pricing'),
    M('A discount for early payment is a...', 'Price incentive', ['Product change', 'Place change', 'Brand story'], 'Pricing'),
    M('A distribution channel moves goods...', 'From maker to buyer', ['From buyer to maker only', 'Between rivals', 'Into storage forever'], 'Channels and promotion'),
    M('Which is a promotion tool?', 'A social media campaign', ['A price tag', 'A factory shift', 'A warehouse'], 'Channels and promotion'),
    M('Selling directly to customers online is...', 'A direct channel', ['An indirect channel', 'A cost centre', 'A segment'], 'Channels and promotion'),
    M('A brand is...', 'The promise and image buyers link to a name', ['Only a logo', 'Only a slogan', 'A legal form'], 'Branding'),
    M('Brand loyalty means customers...', 'Choose the brand again and again', ['Compare every price daily', 'Never see adverts', 'Avoid the product'], 'Branding'),
    M('A consistent brand voice helps because it...', 'Builds trust and recognition', ['Hides mistakes', 'Cuts costs to zero', 'Removes rivals'], 'Branding'),
    B('The four Ps are product, price, place and ____.', 'promotion', ['people', 'profit', 'planning'], 'The marketing mix'),
    B('Dividing a market into groups is called ____.', 'segmentation', ['promotion', 'pricing', 'branding'], 'Segmentation'),
    B('A ____ market is the group a brand chooses to serve.', 'target', ['global', 'closed', 'random'], 'Segmentation'),
    B('A brand\'s place in the buyer\'s mind is its ____.', 'positioning', ['packaging', 'margin', 'inventory'], 'Positioning'),
    B('Adding a margin to cost is ____-plus pricing.', 'cost', ['sales', 'brand', 'trend'], 'Pricing'),
    B('Customers who buy again and again show brand ____.', 'loyalty', ['noise', 'margin', 'stock'], 'Branding'),
    O('Put the steps of targeting in order.', ['Segment the market', 'Choose a target group', 'Position the brand', 'Build the marketing mix'], 'Segmentation'),
    O('Put the steps of launching a product in order.', ['Find a customer need', 'Design the product', 'Set the price', 'Promote and sell'], 'The marketing mix'),
    O('Put the steps of a campaign in order.', ['Set a goal', 'Pick the audience', 'Choose the message', 'Measure the result'], 'Channels and promotion'),
    O('Put the steps of building a brand in order.', ['Know the audience', 'Define the promise', 'Show it consistently', 'Earn loyalty'], 'Branding'),
    T('Match each P to its question.', [['Product', 'What are we selling?'], ['Price', 'What does it cost?'], ['Place', 'Where can they buy it?']], 'The marketing mix'),
    T('Match each segment type to its basis.', [['Demographic', 'Age and income'], ['Geographic', 'Where people live'], ['Behavioural', 'How people buy']], 'Segmentation'),
    T('Match each price approach to its idea.', [['Cost-plus', 'Cost and a margin'], ['Premium', 'High price, high value'], ['Penetration', 'Low price to win share']], 'Pricing'),
    T('Match each tool to its channel type.', [['Own website', 'Direct'], ['Supermarket', 'Indirect'], ['Social advert', 'Promotion']], 'Channels and promotion'),
    T('Match each brand idea to its meaning.', [['Loyalty', 'Buying again and again'], ['Voice', 'How the brand sounds'], ['Promise', 'What the buyer can expect']], 'Branding'),
  ],
  c: [
    M('A variable is...', 'A named place that holds a value', ['A kind of loop', 'A printer', 'A comment'], 'Variables and types'),
    M('Which is a string?', '"hello"', ['42', '3.14', 'True'], 'Variables and types'),
    M('What does `age = 20` do?', 'Stores 20 in age', ['Compares age and 20', 'Prints 20', 'Deletes age'], 'Variables and types'),
    M('What is 7 // 2 in Python?', '3', ['3.5', '4', '2'], 'Operators and expressions'),
    M('What is 2 ** 3?', '8', ['6', '5', '9'], 'Operators and expressions'),
    M('Which operator checks equality?', '==', ['=', '=>', '!='], 'Operators and expressions'),
    M('Which keyword starts a condition?', 'if', ['for', 'def', 'print'], 'Conditions'),
    M('What does `else` do?', 'Runs when the condition is false', ['Repeats the code', 'Ends the program', 'Defines a function'], 'Conditions'),
    M('`x > 5 and x < 10` is true when...', 'x is between 5 and 10', ['x is anything', 'x is 5 or less', 'x is 10 or more'], 'Conditions'),
    M('Which keyword starts a loop over a sequence?', 'for', ['if', 'def', 'print'], 'Loops'),
    M('What does `range(1, 4)` give?', '1, 2, 3', ['1, 2, 3, 4', '0, 1, 2, 3', '2, 3, 4'], 'Loops'),
    M('What does `total += i` do?', 'Adds i to total', ['Resets total', 'Compares total and i', 'Prints total'], 'Loops'),
    M('A function is defined with...', 'def', ['for', 'if', 'while'], 'Functions'),
    M('What does `return` do?', 'Sends a value back to the caller', ['Prints a value', 'Starts a loop', 'Deletes the function'], 'Functions'),
    M('Parameters are...', 'Names for the values a function receives', ['The output', 'Comments', 'Loops'], 'Functions'),
    M('What is len("cat")?', '3', ['2', '4', '1'], 'Lists and strings'),
    M('The first item of a list is at index...', '0', ['1', '-1', '2'], 'Lists and strings'),
    M('Which adds an item to the end of a list?', 'append', ['insert at 0 only', 'remove', 'pop first'], 'Lists and strings'),
    M('A bug is...', 'A mistake in a program', ['A kind of variable', 'A fast loop', 'A comment'], 'Debugging'),
    M('A good first step when code fails is to...', 'Read the error message', ['Delete everything', 'Restart the computer', 'Ignore it'], 'Debugging'),
    M('An off-by-one error is when a loop...', 'Runs one time too many or too few', ['Never starts', 'Prints nothing', 'Uses a function'], 'Debugging'),
    B('Use ____ to check whether two values are equal.', '==', ['=', '=>', '::'], 'Operators and expressions'),
    B('A ____ repeats code for each item in a sequence.', 'for loop', ['comment', 'variable', 'string'], 'Loops'),
    B('A named block of reusable code is a ____.', 'function', ['variable', 'comment', 'loop'], 'Functions'),
    B('The first index of a list is ____.', '0', ['1', '-1', '10'], 'Lists and strings'),
    B('Text in quotes is a ____.', 'string', ['number', 'boolean', 'loop'], 'Variables and types'),
    B('Finding and fixing mistakes is called ____.', 'debugging', ['printing', 'compiling', 'naming'], 'Debugging'),
    O('Put the steps of writing a loop in order.', ['Decide what to repeat', 'Write the for line', 'Indent the body', 'Run and check the output'], 'Loops'),
    O('Put the steps of debugging in order.', ['Read the error', 'Find the line', 'Form a guess', 'Fix and run again'], 'Debugging'),
    O('Put the steps of writing a function in order.', ['Name the function', 'List its parameters', 'Write the body', 'Return the result'], 'Functions'),
    O('Put the steps of an if statement in order.', ['Write the condition', 'Add a colon', 'Indent the action', 'Add an else if needed'], 'Conditions'),
    T('Match each type to an example.', [['String', '"hello"'], ['Integer', '42'], ['Boolean', 'True']], 'Variables and types'),
    T('Match each operator to its job.', [['+', 'Adds'], ['==', 'Checks equal'], ['%', 'Gives the remainder']], 'Operators and expressions'),
    T('Match each keyword to its use.', [['if', 'Choose a path'], ['for', 'Repeat'], ['def', 'Make a function']], 'Conditions'),
    T('Match each list move to its result.', [['append', 'Add to the end'], ['len', 'Count the items'], ['index 0', 'The first item']], 'Lists and strings'),
    T('Match each bug to its cause.', [['Off by one', 'Loop ends too early or late'], ['Typo', 'A misspelled name'], ['Wrong type', 'Mixing text and numbers']], 'Debugging'),
  ],
  d: [
    M('Which is numerical data?', 'Heights in centimetres', ['Favourite colour', 'Postcode labels', 'Names of cities'], 'Data and variables'),
    M('A categorical variable...', 'Puts items into groups', ['Is always a decimal', 'Cannot be counted', 'Is a formula'], 'Data and variables'),
    M('A population is...', 'The whole group of interest', ['A small sample', 'A single value', 'A chart'], 'Data and variables'),
    M('The mean is...', 'The sum divided by the count', ['The middle value', 'The most common value', 'The biggest value'], 'Summarising data'),
    M('The median is...', 'The middle value when sorted', ['The sum divided by the count', 'The most common value', 'The smallest value'], 'Summarising data'),
    M('The mode is...', 'The most frequent value', ['The middle value', 'The average', 'The range'], 'Summarising data'),
    M('One very large salary pulls up the...', 'Mean', ['Median', 'Mode', 'Range'], 'Summarising data'),
    M('The range is...', 'Largest minus smallest', ['Mean minus median', 'Sum of values', 'Count of values'], 'Spread'),
    M('A larger standard deviation means data are...', 'More spread out', ['More alike', 'All equal', 'Missing'], 'Spread'),
    M('Variance is the...', 'Average squared distance from the mean', ['Middle value', 'Most common value', 'Total'], 'Spread'),
    M('A probability is always between...', '0 and 1', ['-1 and 1', '0 and 100 only', '1 and 10'], 'Probability'),
    M('The chance of a fair coin landing heads is...', '0.5', ['0.25', '1', '0'], 'Probability'),
    M('Two events that cannot happen together are...', 'Mutually exclusive', ['Independent', 'Certain', 'Equal'], 'Probability'),
    M('A normal distribution is...', 'Bell-shaped and symmetric', ['Always skewed', 'Flat', 'Two-peaked only'], 'Distributions'),
    M('In a normal distribution, the mean and median are...', 'About equal', ['Far apart', 'Always zero', 'Always one'], 'Distributions'),
    M('A skewed distribution has...', 'A longer tail on one side', ['No tail', 'Equal tails', 'No data'], 'Distributions'),
    M('A sample should be...', 'Representative of the population', ['As small as possible', 'Only volunteers', 'Chosen by mood'], 'Sampling'),
    M('Random sampling helps because it...', 'Reduces bias', ['Guarantees the mean', 'Removes all error', 'Needs no data'], 'Sampling'),
    M('A bigger sample usually gives...', 'A more reliable estimate', ['A biased estimate', 'No estimate', 'A smaller mean'], 'Sampling'),
    M('A null hypothesis usually states...', 'There is no effect or difference', ['There is a big effect', 'The sample is biased', 'The data are wrong'], 'Hypothesis testing'),
    M('A small p-value suggests...', 'The data are unlikely under the null', ['The null is certainly true', 'The sample is empty', 'Nothing at all'], 'Hypothesis testing'),
    B('The ____ is the sum of values divided by the count.', 'mean', ['mode', 'range', 'median'], 'Summarising data'),
    B('The middle value of sorted data is the ____.', 'median', ['mean', 'mode', 'range'], 'Summarising data'),
    B('Largest minus smallest is the ____.', 'range', ['mean', 'median', 'mode'], 'Spread'),
    B('A probability of 1 means the event is ____.', 'certain', ['impossible', 'unlikely', 'even'], 'Probability'),
    B('A ____ is a part of the population we actually measure.', 'sample', ['census', 'parameter', 'table'], 'Sampling'),
    B('A ____ hypothesis says there is no effect.', 'null', ['loud', 'sample', 'normal'], 'Hypothesis testing'),
    O('Put the steps of finding the median in order.', ['List the values', 'Sort them', 'Find the middle', 'Report it'], 'Summarising data'),
    O('Put the steps of calculating the mean in order.', ['Add all the values', 'Count the values', 'Divide the sum by the count', 'Report the mean'], 'Summarising data'),
    O('Put the steps of taking a sample in order.', ['Define the population', 'Choose a sampling method', 'Collect the sample', 'Estimate from it'], 'Sampling'),
    O('Put the steps of a hypothesis test in order.', ['State the null', 'Collect the data', 'Compute the test result', 'Decide and explain'], 'Hypothesis testing'),
    T('Match each average to its meaning.', [['Mean', 'Sum divided by count'], ['Median', 'Middle value'], ['Mode', 'Most frequent value']], 'Summarising data'),
    T('Match each spread measure to its idea.', [['Range', 'Largest minus smallest'], ['Variance', 'Average squared distance'], ['Standard deviation', 'Typical distance from the mean']], 'Spread'),
    T('Match each probability to a case.', [['0', 'Impossible'], ['0.5', 'Even chance'], ['1', 'Certain']], 'Probability'),
    T('Match each shape to its description.', [['Normal', 'Bell-shaped and symmetric'], ['Right-skewed', 'Long tail to the high side'], ['Uniform', 'Every value equally likely']], 'Distributions'),
    T('Match each term to its meaning.', [['Population', 'Everyone of interest'], ['Sample', 'The part measured'], ['Bias', 'A systematic error']], 'Sampling'),
  ],
};

// Weeks 1 to 7: what each covers, for the intro screen.
export const SYLLABUS = {
  a: [
    ['Communication basics', 'The process, barriers, feedback'],
    ['Grammar and tone', 'Tenses, agreement, active and passive'],
    ['Writing for the reader', 'Emails, subject lines, tone'],
    ['Essay writing', 'Thesis, paragraphs, conclusions'],
    ['Reports and resumes', 'Executive summary, structure, resumes'],
    ['Presentations', 'Openings, slides, the close'],
    ['Listening and meetings', 'Active listening, agendas, minutes'],
  ],
  b: [
    ['What marketing is', 'Needs, wants, value'],
    ['The marketing mix', 'Product, price, place, promotion'],
    ['Segmentation and targeting', 'Segment types, target markets'],
    ['Positioning', 'Statements, perception, difference'],
    ['Pricing', 'Cost-plus, premium, penetration'],
    ['Channels and promotion', 'Direct, indirect, campaigns'],
    ['Branding', 'Promise, voice, loyalty'],
  ],
  c: [
    ['Variables and types', 'Strings, numbers, booleans'],
    ['Operators and expressions', 'Arithmetic, comparison'],
    ['Conditions', 'if, else, and, or'],
    ['Loops', 'for, range, accumulating'],
    ['Functions', 'def, parameters, return'],
    ['Lists and strings', 'Indexing, append, length'],
    ['Debugging', 'Errors, tracing, off-by-one'],
  ],
  d: [
    ['Data and variables', 'Types, populations, samples'],
    ['Summarising data', 'Mean, median, mode'],
    ['Spread', 'Range, variance, deviation'],
    ['Probability', 'Rules, events, chance'],
    ['Distributions', 'Normal, skewed, uniform'],
    ['Sampling', 'Methods, bias, size'],
    ['Hypothesis testing', 'Null, p-values, decisions'],
  ],
};

// One neutral slate for every exam, so white text on top always reads (4.5:1 or better).
const SLATE = ['#38444D', '#4B5963'];
export const EXAM_GRADIENT = { a: SLATE, b: SLATE, c: SLATE, d: SLATE };

// How demanding each exam is (1 Warm Up, 2 Stretch, 3 Challenge). `tone` is the neutral grey
// used on the exam intro; `cardTone` is each exam's own colour on the Challenge cards.
export const EXAM_META = {
  a: { cardTone: 'purple', level: 2, tone: 'gray', shape: 'waves' },
  b: { cardTone: 'orange', level: 1, tone: 'gray', shape: 'rings' },
  c: { cardTone: 'green', level: 2, tone: 'gray', shape: 'steps' },
  d: { cardTone: 'blue', level: 3, tone: 'gray', shape: 'bars' },
};

export const EXAM_TYPES = ['Multiple Choice', 'Fill in the Blank', 'Put in Order', 'Match Pairs'];

// A small seeded shuffle so a question always looks the same on every render.
export function shuffled(list, seed) {
  const a = list.map((x, i) => [x, i]);
  let s = (seed + 1) * 9301 + 49297;
  for (let i = a.length - 1; i > 0; i -= 1) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a; // [[item, originalIndex], ...]
}

// The 36 questions for a subject, the four kinds spread through the exam.
export function examFor(subjectId) {
  const bank = BANKS[subjectId] || [];
  const pools = { mcq: [], blank: [], order: [], match: [] };
  bank.forEach((q) => pools[q.type].push(q));
  const pattern = ['mcq', 'mcq', 'blank', 'mcq', 'match', 'mcq', 'order'];
  const out = [];
  let k = 0;
  while (out.length < EXAM_QUESTIONS && Object.values(pools).some((p) => p.length)) {
    let want = pattern[k % pattern.length];
    k += 1;
    if (!pools[want].length) want = Object.keys(pools).find((t) => pools[t].length);
    out.push({ ...pools[want].shift(), id: `${subjectId}-${out.length}` });
  }
  return out;
}

export const examSubjects = () => SUBJECTS;
