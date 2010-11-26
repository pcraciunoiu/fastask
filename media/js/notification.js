/**
 * Handles notifications
 * Expects a global variable FASTASK. Uses FASTASK.notif_handler as a
 * reference to itself which is required for executing events in global scope
 * where `this` is lost.
 * @requires jQuery (tested with 1.4.[012])
 */
function Notification() {
    // reference to list of notifications
    this.notif_list = $('ul', FASTASK.constants.templates.notifbox);

    // reference to last notification added
    this.last_item = null;

    // current count of notifications
    this.count = 0;

    // how many items are showing
    this.showing = 0;

    // (bool) whether the entire notification list is showing or not
    this.showing_list = 0;

    /**
     * Shows the "Adding..." indicator
     */
    this.start = function () {
        FASTASK.constants.templates.indicator.show();
    };

    /**
     * Hides the "Adding..." indicator
     * @see add for example use
     */
    this.finish = function () {
        FASTASK.constants.templates.indicator.hide();
    };

    /**
     * Add a notification of specified type and text
     * Icon is set depending on type
     * @param int type the type of the list
     * @param string text what to text put in the notification
     * @see constants.js for notification types
     */
    this.add = function (type, text) {
        var first_item, this_item;
        if (undefined === type) {
            type = 0;
        }
        this.last_item = FASTASK.constants.templates.notifs.eq(type).clone();
        if (undefined !== text) {
            this.last_item.children().eq(-1).html(text);
        }
        this.count += 1;
        if (this.count > FASTASK.constants.counts.notifmax) {
            first_item = this.notif_list.children().eq(-1);
            clearTimeout(jQuery.data(first_item, 'timeout'));
            first_item.remove();
            this.count -= 1;
        }

        this_item = this.last_item;
        jQuery.data(this.last_item, 'timeout', setTimeout(function () {
            if (1 === FASTASK.notif_handler.showing_list) {
                return;
            }
            this_item.hide();
            FASTASK.notif_handler.showing -= 1;
            // if nothing else showing hide the list too
            if (0 === FASTASK.notif_handler.showing) {
                this_item.parent().hide();
            }
        }, FASTASK.constants.timeouts.notifhide));

        this.notif_list.prepend(this.last_item);
        this.showing += 1;
        this.notif_list.show();
        this.finish();
    };

    /**
     * Show/hide the notifications
     * Also clears the FASTASK.constants.timeouts, stored using jQuery.data()
     */
    $('.top', FASTASK.constants.templates.notifbox).click(function () {
        if (0 === FASTASK.notif_handler.count) {
            return false;
        }
        var items = FASTASK.notif_handler.notif_list.children();
        $.each(items, function (i, item) {
            clearTimeout(jQuery.data(item, 'timeout'));
        });
        FASTASK.notif_handler.showing_list = 1 - FASTASK.notif_handler.showing_list;
        if (FASTASK.notif_handler.showing_list) {
            items.show();
            FASTASK.notif_handler.notif_list.show();
        } else {
            items.hide();
            FASTASK.notif_handler.notif_list.hide();
        }
    });

    // init stuff
    $('#content').append(FASTASK.constants.templates.notifbox);
}
