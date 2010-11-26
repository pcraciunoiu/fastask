/**
 * Handles profiles
 * Expects a global variable FASTASK. Uses FASTASK.profile_handler as a
 * reference to itself which is required for executing events in global scope
 * where `this` is lost.
 * @requires jQuery (tested with 1.4.[012])
 * @requires notification.js
*/
function Profile() {
    // find the form
    this.PROFILE_FORM = $('form', FASTASK.constants.templates.profile);
    this.CURRENT_USER = {
        'id': 0,
        'username': 'fetching...',
        'email': ''
    };

    /**
     * Handles the profile save.
     */
    $('.save', FASTASK.constants.templates.profile).click(function () {
        var form_data = FASTASK.profile_handler.PROFILE_FORM.serialize();
        $.ajax({
            type: 'POST',
            url: FASTASK.constants.templates.profile.find('form').attr('action'),
            data: form_data,
            beforeSend: function () {
                $('.loading', FASTASK.constants.templates.profile).show();
                FASTASK.notif_handler.start();
            },
            error: function (response, text_status, error) {
                $('.loading', FASTASK.constants.templates.profile).hide();
                FASTASK.notif_handler.add(2, 'Could not update your profile');
            },
            success: function (response) {
                if ($('input[name="password_confirm"]').val().length > 0) {
                    FASTASK.notif_handler.add(4);
                } else {
                    FASTASK.notif_handler.add(4, 'Profile updated');
                }
                $('input[name="password"]', FASTASK.constants.templates.profile).val('');
                $('input[name="password_confirm"]', FASTASK.constants.templates.profile).val('');
                $('input[name="current_password"]', FASTASK.constants.templates.profile).val('');
                $('input[name="change_password"]', FASTASK.constants.templates.profile).val('');
                $('.loading', FASTASK.constants.templates.profile).hide();
            }
        });
        return false;
    });

    /**
     * Goes through the steps of changing password.
     */
    $('.submit', FASTASK.constants.templates.profile).click(function () {
        var steps = FASTASK.profile_handler.PROFILE_FORM.find('.steps').children(),
            current_step = steps.index(steps.filter('.on')),
            change_password = FASTASK.profile_handler.PROFILE_FORM
                    .find('input[name="change_password"]').val();
        if (current_step === 0) {
            $('input[name="current_password"]',
                FASTASK.profile_handler.PROFILE_FORM).val(change_password);
            $('.info', FASTASK.constants.templates.profile).hide();
            $('.lstep', FASTASK.constants.templates.profile).html('New password: ');
        } else if (current_step === 1) {
            $(this).val('save');
            $('input[name="password"]',
                FASTASK.profile_handler.PROFILE_FORM).val(change_password);
            $('.info', FASTASK.constants.templates.profile).hide();
            $('.lstep', FASTASK.constants.templates.profile).html('Confirm new password: ');
        } else if (current_step === 2) {
            $('input[name="password_confirm"]',
                FASTASK.profile_handler.PROFILE_FORM).val(change_password);
            $('.save', FASTASK.constants.templates.profile).click();
            current_step = -1;
            $('.lstep', FASTASK.constants.templates.profile).html('Change password: ');
            $('.info', FASTASK.constants.templates.profile).show();
        }
        $('input[name="change_password"]',
            FASTASK.profile_handler.PROFILE_FORM).val('');
        steps
            .removeClass('on')
            .eq(current_step + 1).addClass('on');
        return false;
    });

    // Need to return false for Chrome
    $('form', FASTASK.constants.templates.profile).submit(function () {
        return false;
    });

    /**
     * Shortcut for pressing enter --> calls Next>
     */
    $('input[name="change_password"]', FASTASK.constants.templates.profile).keyup(function (e) {
        if (e.keyCode === 13) {
            $('.submit', FASTASK.constants.templates.profile).click();
            return false;
        }
    });

    /**
     * Gets and builds the list of users in JSON
     */
    this.get_users = function () {
        $.ajax({
            type: 'GET',
            url: FASTASK.constants.paths.users,
            dataType: 'json',
            error: function (response, text_status, error) {
                alert('Error getting users.');
                return false;
            },
            success: function (response, textStatus, request) {
                var html_f, i, current_user;
                FASTASK.constants.templates.followers
                    .children()
                        .remove()
                        .end()
                    .html('');
                for (i in response.users) {
                    if (response.users[i].current) {
                        current_user = response.users[i];
                    }
                    html_f = FASTASK.constants.templates.follower.clone();
                    html_f.find('input')
                        .val(response.users[i].id)
                        .attr('class', 'u' + response.users[i].id)
                    ;
                    html_f.find('span').html(response.users[i].username);
                    FASTASK.constants.templates.followers.append(html_f);
                }
                FASTASK.constants.templates.profile.children('.title')
                    .prepend(current_user.username);
                FASTASK.constants.templates.profile.find('input[name="name"]')
                    .val(current_user.name);
                FASTASK.constants.templates.profile.find('input[name="email"]')
                    .val(current_user.email);

                // update current user and workbox
                FASTASK.profile_handler.CURRENT_USER = current_user;
                FASTASK.workbox_handler.set_share_list();

                FASTASK.profile_handler.continue_init();
            }
        });
    };

    this.continue_init = function () {
        FASTASK.list_handler.get_lists();
        FASTASK.url_handler.allow_get_lists = true;
    };

    // init stuff
    this.get_users();
    FASTASK.constants.templates.profile.appendTo('#content');
}
