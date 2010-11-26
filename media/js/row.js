/**
 * Handles row changes
 * Expects a global variable FASTASK. Uses FASTASK.row_handler as a reference
 * to itself, which is required for executing events in global scope where
 * `this` is lost. Also expects globals for notif_handler, list_handler
 * @requires jQuery (tested with 1.4.[012])
 * @requires list.js
 * @requires notification.js
 */
function Row() {
    // determines which list we're dealing with, main (0) or mini (1)
    this.box_num = null;

    // event target
    this.target = null;

    // row containing the target
    this.t_row = null;

    // task id of the row
    this.task_id = null;

    // @see extract_data() builds this, update_row() uses it
    this.data = null;

    // @see extract() data using this, update_row() sets it
    this.type = -1;

    // ajax call results
    this.response = null;
    this.request = null;
    this.error = null;
    this.textStatus = null;

    /**
     * Extracts data from a row
     */
    this.extract_data = function () {
        this.task_id = this.t_row.find('input[name="task_id"]')[0].value;
        this.data = {
            'url': FASTASK.constants.save[this.type] + this.task_id,
            'method': 'POST',
            'send': {}
        };
        var current, new_text;
        switch (this.type) {
        case 'priority':
            current = parseInt(this.target.attr('class')
                .charAt(this.target.attr('class').indexOf('pri_') + 4), 10);
            this.data.current = current;
            this.data.next = (current + 1) % 3;
            break;
        case 'status':
            break;
        case 'undelete':
            this.data.send.undo = 1;
        case 'delete':
            if (this.t_row.hasClass('deleted')) {
                this.data.send.undo = 1;
                this.type = 'undelete';
            }
            FASTASK.notif_handler.start();
            break;
        case 'plan':
            if (FASTASK.list_handler.plan_custom) {
                this.data.send.due = FASTASK.list_handler.plan_custom;
                FASTASK.list_handler.plan_custom = false;
            }
            break;
        case 'text':
            this.data.url += '&t=' + FASTASK.list_handler.type;
        case 'due':
            new_text = this.target.val()
                .replace(/\\\"/g, '"').replace(/\\\'/g, "'");
            if (cancel_edit_task(this.target, new_text)) {
                return false;
            }
            this.data.send = {};
            this.data.send[this.type] = new_text;
            break;
        case 'follower_add':
            this.data.send = {
                'u': this.target.val(),
                'a': 1
            };
            break;
        case 'follower_remove':
            if (0 === this.t_row.find('.followers ul input:checked').length) {
                FASTASK.notif_handler.start();
            }
            this.data.send = {'u': this.target.val()};
            break;
        default:
            return false;
        }
        return true;
    };


    /*************************************************************************/
    /**
     * DISPATCHERS
     */
    /*************************************************************************/
    /**
     * Dispatches row highlight
     */
    this.dispatch_markrow = function (error) {
        var this_row = this.t_row, timeout = 't' + this.task_id,
            cls = 'ok';
        if (undefined !== error) {
            cls = 'err';
        }
        this_row.addClass(cls);

        clearTimeout(jQuery.data(FASTASK.constants.lists[this.box_num], timeout));
        jQuery.data(FASTASK.constants.lists[this.box_num], timeout,
            setTimeout(function () {
                this_row.removeClass('ok err');
            }, FASTASK.constants.timeouts.changed)
        );
    };

    /**
     * Handles the JSON response for a row
     * @param type shortly, which column was edited
     * @param t_row jQuery object, the row edited
     * @param target jQuery object, the exact target
     * @param response JSON response
     * @param request @see jQuery.ajax documentation
     * @param this.data output of extract_data function
     * @see extract_data()
     */
    this.dispatch_response = function () {
        if (this.request.status !== 200) {
            this.dispatch_error();
            return false;
        }
        if (this.type !== 'text') {
            FASTASK.list_handler.reset_timeout(this.box_num);
        }
        switch (this.type) {
        case 'priority':
            this.target.removeClass('pri_' + this.data.current)
                    .addClass('pri_' + this.response.priority);
            break;
        case 'status':
            if (this.response.status) {
                if (FASTASK.list_handler.type !== 3) {
                    this.t_row.addClass('done');
                }
            } else {
                this.t_row.removeClass('done');
            }
            break;
        case 'undelete':
            this.t_row.removeClass('deleted');
            if (!this.response.task.planned) {
                FASTASK.list_handler.reset_timeout(0);
            }
            FASTASK.notif_handler.add(5);
            break;
        case 'delete':
            this.t_row.addClass('deleted');
            FASTASK.notif_handler.add(1);
            break;
        case 'plan':
            if (this.response.planned) {
                break;
            }
            this.t_row.fadeOut('slow', function () {
                $(this).remove();
                FASTASK.list_handler.clear_timeout();
                FASTASK.list_handler.expect(0);
                FASTASK.list_handler.get_lists();
            });
            break;
        case 'text':
            if (this.response.group) {
                var group = $('<div/>').html(
                    FASTASK.constants.templates.rowgroup.clone().attr('href', '#g=' +
                        this.response.group.id)
                        .html(this.response.group.name)
                    );
                this.response.text = group.html() + ': ' + this.response.text;
            }
            FASTASK.list_handler.update_groups(this.response.groups);
            finish_edit(this.target, this.response.text);
            break;
        case 'due':
            if (this.response.planned) {
                FASTASK.list_handler.reset_timeout(1);
            }
            finish_edit(this.target, this.response.due_out);
            break;
        case 'follower_add':
        case 'follower_remove':
            FASTASK.notif_handler.finish();
            break;
        default:
            break;
        }

        // color this row
        // positive color
        this.dispatch_markrow();
        return true;
    };

    /**
     * Handles errors
     */
    this.dispatch_error = function () {
        switch (this.type) {
        case 'priority':
            break;
        case 'status':
            if (!this.t_row.hasClass('done')) {
                this.t_row.removeClass('done');
                this.target.attr('checked', '');
            } else {
                if (FASTASK.list_handler.type !== 3) {
                    this.t_row.addClass('done');
                }
                this.target.attr('checked', 'checked');
            }
            break;
        case 'undelete':
            FASTASK.notif_handler.add(2, 'Could not undo deletion.');
            break;
        case 'delete':
            FASTASK.notif_handler.add(2, 'Could not delete.');
            break;
        case 'plan':
            FASTASK.notif_handler.add(2, 'Could not plan.');
            break;
        case 'text':
            FASTASK.notif_handler.add(2, 'Could not update text.');
            break;
        case 'due':
            FASTASK.notif_handler.add(2, 'Could not update due date.');
            break;
        case 'follower_add':
            if (this.request.responseText === 'already') {
                FASTASK.notif_handler.add(2, 'Already sharing with this user.');
                if (!this.target.is(':checked')) {
                    this.target.attr('checked', 'checked');
                } else {
                    this.target.attr('checked', '');
                }
            } else {
                FASTASK.notif_handler.add(2, 'Could not share with this user.');
            }
            break;
        case 'follower_remove':
            if (this.request.responseText === 'toofew') {
                FASTASK.notif_handler.add(2);
                if (this.target.is(':checked')) {
                    this.target.attr('checked', '');
                } else {
                    this.target.attr('checked', 'checked');
                }
            } else {
                FASTASK.notif_handler.add(2, 'Already removed this user.');
            }
            break;
        default:
            break;
        }

        // color this row
        // negative color
        this.dispatch_markrow(true);
        return true;
    };

    /**
     * Updating row
     * @param type = update type, one of 'priority', 'status'
     * @param target = the target of the event
     */
    this.update_row = function (type, target) {
        this.type = type;
        this.target = target;
        this.t_row = target.parents('.row');
        this.box_num = target.parents('.box').attr('rel');
        FASTASK.list_handler.clear_timeout(FASTASK.constants.lists[this.box_num]);
        if (this.is_loading_row(this.t_row)) {
            return false;
        }
        if (!this.extract_data()) {
            return false;
        }
        // need this inside ajax, scope
        $.ajax({
            type: this.data.method,
            url: this.data.url,
            data: this.data.send,
            dataType: 'json',
            beforeSend: function () {
                FASTASK.row_handler.set_loading_row();
            },
            error: function (request, textStatus, error) {
                FASTASK.row_handler.request = request;
                FASTASK.row_handler.textStatus = textStatus;
                FASTASK.row_handler.error = error;
                FASTASK.row_handler.response = null;
                FASTASK.row_handler.dispatch_error();
                FASTASK.row_handler.unset_loading_row();
                return false;
            },
            success: function (response, textStatus, request) {
                FASTASK.row_handler.response = response;
                FASTASK.row_handler.textStatus = textStatus;
                FASTASK.row_handler.request = request;
                FASTASK.row_handler.error = null;
                FASTASK.row_handler.dispatch_response();
                FASTASK.row_handler.unset_loading_row();
            }
        });
    };

    /**
     * Row loading helpers
     */
    this.is_loading_row = function () {
        if (this.t_row.hasClass(FASTASK.constants.classes.loadrow)) {
            return true;
        }
        return false;
    };
    this.set_loading_row = function () {
        this.t_row.addClass(FASTASK.constants.classes.loadrow);
    };
    this.unset_loading_row = function () {
        this.t_row.removeClass(FASTASK.constants.classes.loadrow);
    };
    /* end row loading helpers */

    /*************************************************************************/
    /**
     * EDITABLE FIELDS
     */
    /*************************************************************************/
    /**
     * Enter/escape actions inside form
     * Navigation inside table
     */
    function handle_editable_keydown(e) {
        var type, move_ref, t_row, t_d, form_index, r;
        if (e.keyCode === 13) {
            type = $(this).parents('.td')
                .attr('class').substr(3);
            // enter pressed
            if (type.indexOf(' ') >= 0) {
                type = type.substr(0, type.indexOf(' '));
            }
            FASTASK.row_handler.update_row(type, $(this));
            return false;
        }
        else if (e.keyCode === 27) {
            // esc pressed
            $(this).focusout();
            return false;
        }
        move_ref = [];
        t_row = $(this).parents('.row');
        t_d = $(this).parents('.td');
        form_index = 0;
        // move down
        if (e.keyCode === 40) {
            move_ref = t_row.next();
            if (move_ref.length <= 0) {
                move_ref = t_row.parent().children().eq(0);
            }
            if ($(this).parents('.td').hasClass('due')) {
                form_index = 1;
            }
        // move up
        } else if (e.keyCode === 38) {
            move_ref = t_row.prev();
            if (move_ref.length <= 0) {
                move_ref = t_row.parent().children().last();
            }
            if ($(this).parents('.td').hasClass('due')) {
                form_index = 1;
            }
        // move right
        } else if (e.altKey && e.ctrlKey && e.keyCode === 39) {
            move_ref = t_row;
        // move left
        } else if (e.altKey && e.ctrlKey && e.keyCode === 37) {
            move_ref = t_row;
        } else {
            return true;
        }
        if (move_ref.length > 0) {
            move_ref = move_ref.find('.editable').eq(form_index).parent();
            cancel_edit_task($(this));
            r = move_ref.find('.editable');
            r.click();
        }
        return false;

    }

    function handle_editable_focusout(e) {
        cancel_edit_task($(this));
    }

    // this is required for e.g. Chrome
    function handle_editable_submit(e) {
        return false;
    }

    /**
     * Returns previous text to use when deciding to save or cancel
     * @param ref the editable element clicked.
     */
    function get_old_text(ref) {
        return ref.parents('.row').find('input[name="buffer"]')
            .val().replace(/\\\"/g, '"').replace(/\\\'/g, "'");
    }

    /**
     * Cancel an edit and restores old text if old text == new text
     * @param ref the editable element clicked.
     */
    function cancel_edit_task(ref, new_text) {
        var old_text = get_old_text(ref);
        if (new_text && new_text !== plain_text(old_text)) {
            return false;
        }
        finish_edit(ref, old_text);
        return true;
    }

    /**
     * Finishes an edit. Replaces the form with the text.
     * @param ref the editable element clicked.
     */
    function finish_edit(ref, text) {
        var editable = FASTASK.constants.templates.editable.clone().html(text);
        editable.width(ref.next().attr('rel') + 'px');
        if (FASTASK.list_handler.type === 1 && ref.parents('.td')
            .children('.g').length > 0) {
            editable.css('text-indent',
                (ref.parents('.td').children('.g').width()) + 'px');
        }
        editable.bind('click', FASTASK.row_handler.replace_html);
        ref.parents('.td')
            .children('form.inplace')
                .remove()
                .end()
            .append(editable);
        FASTASK.list_handler.editing[0] = false;
    }

    /**
     * Replaces the editable field with a form.
     */
    this.replace_html = function (event) {
        if (event.button !== undefined && event.button !== 0) {
            return true;
        }
        var id = $(this).parents('.box').attr('rel'), buffer, rephtml,
            the_parent;

        if (FASTASK.list_handler.editing[id]) {
            return;
        }
        buffer = $(this).html().replace(/"/g, '&quot;');
        rephtml = $(build_editable_html(buffer, $(this).width()));
        the_parent = $(this).parent();
        if (FASTASK.list_handler.type === 1) {
            rephtml.find('input[type="text"]').width(
                the_parent.width() - $(this).prev().width() -
                FASTASK.constants.pixels.assignmentwidth
            );
        }
        $(this).remove();
        the_parent
            .append(rephtml)
            .unbind('click', FASTASK.row_handler.replace_html)
            .find('input:first-child')
            .bind('keydown', handle_editable_keydown)
            .bind('focusout', handle_editable_focusout)
            .focus();
        rephtml.bind('submit', handle_editable_submit);
        FASTASK.list_handler.editing[id] = 1;
    };

    /**
     * Builds the editable form
     */
    function build_editable_html(buffer, preserved_width) {
        return '<form class="inplace"><input type="text" value="' +
            plain_text(buffer) +
            '" /><input type="hidden" name="buffer" value="' +
            buffer + '" rel="' + preserved_width + '"/></form>';
    }

    /**
     * Turns HTML into plain text.
     */
    function plain_text(text) {
        return text.replace(/(<([^>]+)>)/ig, '');
    }
    /* end of code for editable fields */
}
