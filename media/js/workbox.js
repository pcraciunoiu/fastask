/**
 * Handles adding tasks
 * Expects a global variable FASTASK. Uses FASTASK.workbox_handler as a
 * reference to itself which is required for executing events in global scope
 * where `this` is lost.
 * @requires jQuery (tested with 1.4.[012])
 * @requires notification.js
 * @requires list.js
 * @requires profile.js
*/
function Workbox() {
    this.groups_auto = [];
    this.groups_refresh = false;

    this.set_share_list = function () {
        // create list of users to share and move up current user
        var share_with = FASTASK.constants.templates.followers.clone(),
            current_user = share_with
                .children(':first').find('input')
                    .attr('checked', 'checked')
                .parent();
        $('.share .input', FASTASK.constants.templates.workbox)
            .text(current_user.find('span').text());

        FASTASK.constants.templates.collaborate.bind('click', this.add_collaborator);
        share_with.append(FASTASK.constants.templates.collaborate);
        share_with
            .appendTo('.share', FASTASK.constants.templates.workbox);
        $('.share input', FASTASK.constants.templates.workbox).bind('click', manage_share);
    };

    this.get_all_groups = function () {
        // update autocomplete
        $.ajax({
            url: FASTASK.constants.paths.groups,
            type: 'POST',
            async: true,
            cache: false,
            dataType: 'json',
            timeout: 3000,
            global: false,
            error: function(request, textStatus, error) {
                // fail silently
                return false;
            },
            success: function(data, textStatus, request) {
                FASTASK.workbox_handler.groups_auto = [];

                if (data.results.length > 0) {
                    for (var i in data.results) {
                        FASTASK.workbox_handler.groups_auto.push(data
                            .results[i].name);
                    }
                }
                $('textarea', FASTASK.constants.templates.workbox)
                    .autocomplete(FASTASK.workbox_handler.groups_auto);
            }
        });
    };


    /**
     * Handles form submission. Creates task and refreshes one of the lists.
     */
    $('input[type="submit"]', FASTASK.constants.templates.workbox).click(function () {
        var form_data = $('form', FASTASK.constants.templates.workbox).serialize(),
            target = $(this);
        $.ajax({
            type: 'POST',
            url: FASTASK.constants.templates.workbox.find('form').attr('action'),
            data: form_data + '&' + target.attr('name') + '=1' +
                '&t=' + FASTASK.list_handler.type,
            beforeSend: function () {
                FASTASK.constants.templates.spinwheel.show();
                FASTASK.notif_handler.start();
            },
            error: function (response, text_status, error) {
                FASTASK.constants.templates.spinwheel.hide();
                if (target.attr('name') === 'add') {
                    FASTASK.notif_handler.add(2, 'Failed to add task');
                } else {
                    FASTASK.notif_handler.add(2, 'Failed to plan task');
                }
            },
            success: function (response) {
                FASTASK.list_handler.update_groups(response.groups);
                if (response.planned) {
                    FASTASK.list_handler.expect(1);
                    FASTASK.notif_handler.add(3, 'Task planned');
                } else {
                    FASTASK.list_handler.expect(0);
                    FASTASK.notif_handler.add(0);
                }
                FASTASK.list_handler.get_lists();
                FASTASK.constants.templates.spinwheel.hide();
            }
        });
        return false;
    });

    /**
     * Manages the sharing
     */
    function manage_share() {
        var s_obj = $('.share .input', FASTASK.constants.templates.workbox),
            s_text = s_obj.text(),
            the_input = $(this),
            new_text = the_input.next().html(),
            this_in_regex = new RegExp('([ ]|^)' + new_text + '([ ]|$)'),
            this_in = this_in_regex.exec(s_text);

        if (!the_input.is(':checked') &&
            the_input.parents('ul').find(':checked').length <= 0) {
            FASTASK.notif_handler.add(2);
            return false;
        }

        if (the_input.is(':checked')) {
            if (this_in === null) {
                s_obj.text(s_text + ' ' + new_text);
            }
        } else {
            s_obj.text(s_text.replace(this_in_regex, ' '));
        }
    }

    /**
     * Add new people to share with
     */
    this.add_collaborator = function (e) {
        FASTASK.modal_handler.show_prompt(
            'Type username or email and press ENTER: ' +
            '<input type="text" name="share_with" />',
            'collaborator',
            'keyup',
            function (ev) {
                // enter or tab
                if (ev.keyCode === 13) {
                    FASTASK.workbox_handler.share_notify($(this).val());
                    FASTASK.constants.templates.modal.children('.jqmClose').click();
                }
            }
        );
        return false;
    };

    /**
     * Calls an ajax function which sends out an email invitation to the user
     */
    this.share_notify = function (val) {
        // update autocomplete
        $.ajax({
            url: FASTASK.constants.paths.share,
            type: 'POST',
            async: true,
            cache: false,
            data: {'user': val},
            dataType: 'json',
            timeout: 3000,
            global: false,
            error: function(request, textStatus, error) {
                if (request.status === 404) {
                    FASTASK.notif_handler.add(2, 'User not found.');
                    return false;
                } else if (request.status == 400) {
                    switch (request.responseText) {
                    case 'blocked':
                        FASTASK.notif_handler.add(2, val +
                            ' has blocked you.');
                        break;
                    case 'exists':
                        FASTASK.notif_handler.add(2, 'Already sent ' + val +
                            ' an email.');
                        break;
                    case 'self':
                        FASTASK.notif_handler.add(2, 'Sharing with yourself?');
                        break;
                    case 'already':
                        FASTASK.notif_handler.add(2, 'Already sharing with ' + val +
                            '.');
                        break;
                    default:
                        FASTASK.notif_handler.add(2, 'Could not send invitation.');
                    }
                    return false;
                }
                FASTASK.notif_handler.add(2, 'Could not send invitation.');
                return false;
            },
            success: function(response, textStatus, request) {
                FASTASK.notif_handler.add(4, 'Notification sent to ' +
                    response.username + '.');
            }
        });
    };

    /**
     * Updates the priority on click
     */
    $('.priority .p', FASTASK.constants.templates.workbox).click(function () {
        if ($(this).hasClass('s')) {
            $(this).parents('.priority').find('input').val('3');
            $(this).removeClass('s');
        }
        else {
            $(this).parents('.priority').find('.p')
                .removeClass('s');
            $(this).parents('.priority').find('input')
                .val($(this).find('.img').attr('alt'));
            $(this)
                .addClass('s');
        }
        return false;
    });

    /**
     * Clears the workbox
     */
    $('.clear', FASTASK.constants.templates.workbox).click(function () {
        $('textarea', FASTASK.constants.templates.workbox)[0].value = '';
        $('input[name="due"]', FASTASK.constants.templates.workbox).val(FASTASK.constants.workbox.due);
        $('.share .input', FASTASK.constants.templates.workbox).html(
            FASTASK.constants.templates.followers.children(':first').find('span').html());
        $('.share input', FASTASK.constants.templates.workbox).attr('checked', '');
        $('.share input', FASTASK.constants.templates.workbox).eq(0).attr('checked', 'checked');
        $('.priority input', FASTASK.constants.templates.workbox).val(FASTASK.constants.workbox.priority);
        $('.priority .p', FASTASK.constants.templates.workbox).removeClass('s');
        return false;
    });

    // init stuff
    FASTASK.constants.templates.spinwheel.appendTo(FASTASK.constants.templates.workbox).hide();
    FASTASK.constants.templates.workbox.prependTo('#content');
    this.get_all_groups();
    this.groups_refresh = setInterval(this.get_all_groups,
        FASTASK.constants.timeouts.autorefresh);
}
