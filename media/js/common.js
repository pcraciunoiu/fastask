$('body').addClass('js');
$('#main .nojs').hide();
$('.js-only').show();
$('.errorlist a').click(function (ev) {
    ev.preventDefault();
    var $el = $($(this).attr('href'));
    if ($el.length > 0) {
        $el.focus();
    }
    return false;
});
