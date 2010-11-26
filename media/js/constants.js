/**
 * Contains constans used throughout the other js files
 * Each constant is preceded by a short description of use.
 * Most of these can be customized.
 * When changing something, check around this file for other instances affected
 */
var FASTASK = {};

FASTASK.constants = {};
// Shorthand, save some space.
FC = FASTASK.constants;

/*-------------- PURE JS ----------------*/
// NOTES:
// for timeouts, unless stated, assume milliseconds
// for sizes, unless stated, assume pixels
FC.save = {
    'priority': '/task/pri/',
    'status': '/task/s/',
    'delete': '/task/d/',
    'undelete': '/task/d/',
    'plan': '/task/plan/',
    'text': '/task/text/',
    'due': '/task/due/',
    'follower_add': '/task/share/',
    'follower_remove': '/task/share/'
};

FC.classes = {
    'loadrow': 'loadbar'
};

FC.strings = {
    'due': '+7d'
};

FC.timeouts = {
// delay for searching after last keypress
    'search': 500,

// delay for quick reloading a list after user interaction
    'changed': 5000,

// delay for autorefresh
    'refresh': 120000,

// delay for window resize
    'resize': 2000,

// delay for notification, hidden after this time
    'notifhide': 2500,

// how often to refresh autocomplete
    'autorefresh': 90251
};

FC.counts = {
// minimum character count to trigger search
    'searchmin': 5,

// maximum number of notifications to keep/show at any time
    'notifmax': 5
};

FC.pixels = {
// height for task row in list
    'rowheight': 30,

// height adjustment for main list, used to determine number of tasks
    'mainminus': 100,

// height adjustment for planner/trash, used to determine number of tasks
    'miniminus': 110,

// editable span width needs to be adjusted on main list
// when groups are read-only
    'assignmentwidth': 20,
// so does the text indent
    'assignmentindent': 5
};

// separator for variables in the url hash
FC.hash_separator= ';';

// plain titles for the lists, used in e.g. notifications
FC.titles_plain = [
    'my tasks',
    'assignments',
    'command',
    'archive',
    'search',
    'planner',
    'trash'
];
// the html version, used in e.g. groups
FC.titles_html = [
    '<a href="#t=0">' + FC.titles_plain[0] + '</a>',
    '<a href="#t=1">' + FC.titles_plain[1] + '</a>',
    '<a href="#t=2">' + FC.titles_plain[2] + '</a>',
    '<a href="#t=3">' + FC.titles_plain[3] + '</a>',
    '<a href="#s=1">' + FC.titles_plain[4] + '</a>',
    '<a href="#l=1">' + FC.titles_plain[5] + '</a>',
    '<a href="#l=2">' + FC.titles_plain[6] + '</a>'
];

// used with ajax, for performing calls
FC.paths = {
    'users': '/user/l/',
    'list': '/in/t/',
    'share': '/user/s/',
    'groups': '/group/l/'
};

// url parameters (in hash)
FC.params = {
    'mainpage': 'p',
    'minipage': 'u',
    'group': 'g',
    'type': 't',
    'minitype': 'l'
};

/*-------------- JQUERY -----------------*/

FC.templates = {
// shown when no tasks in list
    'notasks': $('#data-notasks').children().first(),

// used to create the list of groups
    'groups': $('<ul></ul>'),
    'group': $('#data-group').children().first(),

// used to create the list of followers
// this will be altered in listhandler.js on init
    'followers': $('<ul></ul>'),
    'follower': $('#data-follower').children().first(),

// main row template
    'mainrow': $('#data-mainrow').children().first(),

// mini row template (for planner, trash)
    'minirow': $('#data-minirow').children().first(),

// used to greate a single group in a row
    'rowgroup': $('#data-rowgroup').children().first(),

// used to create an editable element
    'editable': $('#data-editable').children().first(),

// the notifications box, used to create the main area
    'notifbox': $('#data-notification').children().first(),

// notifications with icons
    'notifs': $('#data-notifs').children(),

// modal window template
    'modal_trigger': $('#data-modal_trigger').children().first(),

    'modal': $('#data-modal').children().first(),

// profile template
    'profile': $('#data-profile').children().first(),

// workbox template
    'workbox': $('#data-work-box').children().first(),

// spinwheel template
    'spinwheel': $('#data-spinwheel').children().first(),

// collaborate template
    'collaborate': $('#data-collaborate').children().first(),

// help trigger
    'help_trigger': $('#data-help_trigger').children().first()
};

// indicates if a notification is about to be added
// partially used to indicate that request is processing
FC.templates.indicator = $('div.top span.adding', FC.templates.notifbox);

// Sets default due date for workbox template
$('form input[name="due"]', FC.templates.workbox).val(FC.strings.due);


FC.lists = [
// main list template
    $('#data-task-box').children().first(),

// minibox template
    $('#data-mini').children().first()
];

FC.workbox = {
// default due date
    'due': '+7d',

// default priority
    'priority': '3'
};

FC.help = $('#data-help').html();