/**
 * Validates an email address
 */
function isValidEmail(in_test) {
    var pattern = new RegExp(/^(("[\w-\s]+")|([\w-]+(?:\.[\w-]+)*)|("[\w-\s]+")([\w-]+(?:\.[\w-]+)*))(@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$)|(@\[?((25[0-5]\.|2[0-4][0-9]\.|1[0-9]{2}\.|[0-9]{1,2}\.))((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\.){2}(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[0-9]{1,2})\]?$)/i);
    return pattern.test(in_test);
}

/**
 * Validates username
 */
function isValidUsername(in_test) {
    if (in_test.length <= 0) return false;
    var trimmed = $.trim(in_test);
    if (trimmed !== in_test) {
        return false;
    }

    var pattern = new RegExp(/^([a-z0-9\-_]{3,50})$/i);
    return pattern.test(in_test);
}

/**
 * Returns a password strength score
 */
function passwordStrength(password) {
    var score = 0;

    //if password shorter than 6
    if (password.length < 6) return score;
    score++;

    //if password has both lower and uppercase characters
    if ( ( password.match(/[a-z]/) ) && ( password.match(/[A-Z]/) ) ) score++;

    //if password has at least one number
    if (password.match(/\d+/)) score++;

    //if password has at least one special caracther
    if ( password.match(/.[!,@,#,$,%,^,&,*,?,_,~,-,(,)]/) ) score++;

    //if password longer than 12
    if (password.length > 12) score++;

    return score;
}


$(document).ready(function() {
    var   in_username = $('.register input[name="username"]')
        , in_email = $('.register input[name="email"]')
        , in_password = $('.register input[name="password"]')
        , in_password_confirm = $('.register input[name="password_confirm"]')
        , password_indication = {
            'text'     : ['Very Weak', 'Weak', 'Better',
                'Medium', 'Strong', 'Strongest'],
            'strength' : [0, 1, 2, 3, 4, 5],
        }
        , PASS_CONFIRM_INIT = ''
    ;
    /**
     * Init
     */
    $('#content .nojs').hide();
    $('#content .register').show();
    $('#content .login').show();


    in_password.keyup(function () {
            var score = passwordStrength(in_password.val());
        handle_validation(in_password, function () {
            return score !== 0;
        });
        in_password.parents('label').next().find('.info')
            .html(password_indication['text'][
                password_indication['strength'][score]
            ]);
        for (i = 0; i < 6; i++) {
            $('.s-' + i).removeClass('on');
        }

        in_password_confirm.keyup();

        if (score <= 0) return;
        for (i = 0; i < 6; i++) {
            if (i > score) break;
            $('.s-' + i).addClass('on');
        }
    });

    in_password_confirm.keyup(function () {
        if (in_password.val().length <= 0) return;
        if (!PASS_CONFIRM_INIT) {
            PASS_CONFIRM_INIT = in_password_confirm.parents('label')
                .find('.info').html();
        }
        handle_validation(in_password_confirm, function () {
            var pass = in_password_confirm.val();
            return pass === in_password.val();
        });
        if (in_password_confirm.hasClass('valid')) {
            in_password_confirm.parents('label').find('.info')
                .html('Bingo!');
        } else {
            in_password_confirm.parents('label').find('.info')
                .html(PASS_CONFIRM_INIT);
        }
    });

    /**
     * Validates email
     */
    in_email.keyup(function () {
        handle_validation(in_email, isValidEmail);
    })

    /**
     * Validates username
     */
    in_username.keyup(function () {
        handle_validation(in_username, isValidUsername);
    })

    function handle_validation(elem, func) {
        if (!func(elem.val())) {
            elem
                .removeClass()
                .addClass('invalid');
            elem.parents('label').find('.icon')
                .removeClass('valid')
                .addClass('invalid');
        } else {
            elem
                .removeClass()
                .addClass('valid');
            elem.parents('label').find('.icon')
                .removeClass('invalid')
                .addClass('valid');
        }
    }

    /**
     * Checks username is available
     */
    in_username.blur(function () {
        handle_validation(in_username, isValidUsername);
        if (!in_username.hasClass('valid')) {
            return false;
        }
        $.ajax({
            type: 'POST',
            url: '/user/available',
            dataType: 'json',
            data: {'username': in_username.val()},
            error: function (response, text_status, error) {
                in_username
                    .removeClass()
                    .addClass('unavailable');
            },
            success: function(response, textStatus, request) {
                if (request.status != 200 ||
                    response.available != 1) {
                    // not available
                    in_username
                        .removeClass()
                        .addClass('unavailable');
                } else {
                    in_username
                        .removeClass()
                        .addClass('available');
                }
            }
        });
    });


    $('.register input[type="text"]').focus(function() {
        $(this).parents('label').children('.info-icon').children().addClass('on');
    }).blur(function () {
        if ($(this).parents('label').find('.invalid').length > 0) return;
        $(this).parents('label').children('.info-icon').children().removeClass('on');
    });
    $('.register input[type="password"]').focus(function() {
        $(this).parents('label').children('.info-icon').children().addClass('on');
        $('.strength .info-icon span').show();
    }).blur(function () {
        if ($(this).parents('label').find('.invalid').length > 0) return;
        $(this).parents('label').children('.info-icon').children().removeClass('on');
        $('.strength .info-icon span').hide();
    });
});
