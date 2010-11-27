/**
 * Main driver for fastask
 * Instantiates all objects and fires up the task list getter.
 * Each object appends its templates to the content when it is created.
 * @see constants.js for template and other initial setup
 */
$(document).ready(function () {
    $('#content .nojs').remove();

    // Initialize all the components
    FASTASK.modal_handler = new Modal();
    FASTASK.notif_handler = new Notification();
    FASTASK.list_handler = new List();
    FASTASK.row_handler = new Row();
    FASTASK.url_handler = new Url();
    FASTASK.workbox_handler = new Workbox();

    FASTASK.list_handler.set_params(
        FASTASK.url_handler.mainpage,
        FASTASK.url_handler.minipage,
        FASTASK.url_handler.group,
        FASTASK.url_handler.type
    );

    // this one fires off the calls
    FASTASK.profile_handler = new Profile();
});
