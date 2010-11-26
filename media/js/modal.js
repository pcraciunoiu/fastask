/**
 * Handles notifications
 * Expects a global variable FASTASK. Uses
 * FASTASK.modal_handler as a reference to itself which is required for
 * executing events in global scope where `this` is lost.
 * @requires jQuery (tested with 1.4.[012])
 */
function Modal() {
    // reference to list of notifications
    this.classes = [];

    // reference to last notification added
    this.last_item = null;

    // current count of notifications
    this.count = 0;

    // how many items are showing
    this.showing = 0;

    // (bool) whether the entire notification list is showing or not
    this.showing_list = 0;

    /**
     * Shows the modal window as a prompt
     * @param string text to populate it with
     * @param string cls class to add (will be removed on close)
     * @param string ev_type the event type to listen for on the input
     *     (usually keyup, ENTER)
     * @param reference func this is called when ev_type occurs
     */
    this.show_prompt = function (text, cls, ev_type, func) {
        var i;
        // clean up classes
        if (this.classes.length > 0) {
            for (i in this.classes) {
                FASTASK.constants.templates.modal.removeClass(this.classes[i]);
            }
            this.classes = [];
        }

        $('.text', FASTASK.constants.templates.modal).html(text);
        $('input', FASTASK.constants.templates.modal).bind(ev_type, func);
        FASTASK.constants.templates.modal.addClass(cls);
        this.classes.push(cls);
        FASTASK.constants.templates.modal_trigger.click();
        $('input', FASTASK.constants.templates.modal).focus();
    };

    this.help = function () {
        FASTASK.constants.templates.modal.find('.help a').click(function () {
            var url = $(this).attr('href');
            if (url.indexOf('#') === 0) {
                document.getElementById(url.substr(1)).scrollIntoView(true);
                return false;
            }
        });
        FASTASK.constants.templates.modal.addClass('help');
        FASTASK.modal_handler.classes.push('help');
        FASTASK.constants.templates.modal_trigger.click();
        return false;
    }

    /**
     * Click anywhere on body or pressing esc hides modal dialog
     */
    $('body').keydown(function (e) {
        if ((e.keyCode === 27) &&
            FASTASK.constants.templates.modal.is(':visible')) {
            // esc pressed
            FASTASK.constants.templates.modal.children('.text').children().remove().end()
                .html('');
            FASTASK.constants.templates.modal.children('.jqmClose').click();
            return false;
        }
    });

    // init stuff
    FASTASK.constants.templates.modal.appendTo('#content');
    FASTASK.constants.templates.modal_trigger.appendTo('#content');
    FASTASK.constants.templates.modal.jqm();
    $('.text', FASTASK.constants.templates.modal).html(FASTASK.constants.help);
    FASTASK.constants.templates.help_trigger.click(this.help);
    FASTASK.constants.templates.help_trigger.appendTo('#content');
}
