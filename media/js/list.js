/**
 * Handles lists: reloads, creation, searches, etc
 * Expects a global variable FASTASK. Uses FASTASK.list_handler to reference
 * self, which is required for executing events in global scope where `this`
 * is lost. Also expects globals for url_handler, row_handler, notif_handler
 * @requires jQuery (tested with 1.4.[012])
 * @requires url.js
 * @requires row.js
 * @requires notification.js
 */
function List() {
    // ajax call results
    this.response = null;
    this.request = null;
    this.error = null;

    // tasks per page
    this.main_per_page = 10;

    // list of groups
    this.groups_list = false;

    // search value, used in do_search()
    this.search_val = '';
    // stored for comparison and reset to avoid searching again
    this.last_search_q = '';

    // store planning custom date
    this.plan_custom = false;

    // timeouts
    this.search_timeout = false;
    this.refresh_timeout = false;
    this.resize_timeout = false;
    this.list_timeout = false;

    // marked with `true` if list is being edited
    this.editing = [0, 0];

    // hash parameters
    this.mainpage = null;
    this.group = null;
    this.type = null;

    /**
     * Sets the parameters from url hash
     * @param int mainpage the page for the main list
     * @param int group the group
     * @param int type indicates the active tab
     */
    this.set_params = function (mainpage, group, type) {
        this.mainpage = mainpage;
        this.group = group;
        this.type = type;
    };

    // Timeouts helpers
    /**
     * Clears the timeouts for list and refresh
     */
    this.clear_timeout = function () {
        if (this.list_timeout) {
            clearTimeout(this.list_timeout);
            clearTimeout(this.refresh_timeout);
        }
    };

    /**
     * Resets the timeouts for list and refresh
     */
    this.reset_timeout = function () {
        this.clear_timeout();
        this.list_timeout = setTimeout(function () {
            FASTASK.list_handler.get_lists();
        }, FASTASK.constants.timeouts.changed);
        this.refresh_timeout = setInterval(this.refresh_all,
            FASTASK.constants.timeouts.refresh);
    };

    /**
     * Refreshes list.
     */
    this.refresh_all = function () {
        FASTASK.list_handler.get_lists();
    };
    // End timeouts helpers

    // Task loading helpers
    /**
     * Mark the list as loading
     * @returns true if request was carried out
     *     or false if not allowed. used to check list is busy
     */
    this.set_loading = function () {
        // if list is being edited, return false
        if (this.editing) {
            return false;
        }

        FASTASK.constant.list.children('.loading').show();
        return true;
    };

    /**
     * Mark the list as not loading (unset)
     */
    this.unset_loading = function () {
        FASTASK.constants.list.children('.loading').hide();
    };
    // End task loading helpers

    /**
     * Set a custom plan date
     * @param string val will be interpreted as task due date
     */
    this.plan = function (val) {
        this.plan_custom = val;
    };

    /**
     * Fetching a list
     */
    this.get_lists = function () {
        // store internals for passing around of data
        FASTASK.list_handler.response = {
            tasks: FASTASK.data.get_tasks(),
            groups: FASTASK.data.get_folders(),
            counts: [2, 0, 4, 12],
            pager: ''
        };

        // build the lists according to responses
        FASTASK.list_handler.build_lists();

        // unload
        FASTASK.list_handler.unset_loading();

        FASTASK.list_handler.update_active_tabs();
    };

    /**
     * Updates the active tabs according to current state
     */
    this.update_active_tabs = function () {
        $('.tabs .icon', FASTASK.constants.list)
            .removeClass('active')
            .eq(FASTASK.list_handler.type).addClass('active');
    };

    /**
     * Builds the lists according to this.response
     */
    this.build_lists = function () {
        var i, k, html_task, html_text, pager;
        // build task list from json
        this.update_groups();

        $('.notasks', FASTASK.constants.list).remove();
        $('.table', FASTASK.constants.list)
            .children().remove().end()
            .html('');

        for (i in this.response.tasks) {
            // build main list
            html_task = this.build_task_json(i);
            html_task.appendTo(FASTASK.constants.list.children('.table'));
            if (1 === this.type && this.response.tasks[i].group) {
                html_text = html_task.children('.text');
                html_text.find('.editable').width(
                    html_text.width() - html_text.find('.g').width() -
                    this.ASSIGNMENT_EDITABLE_WIDTH_ADJUSTMENT);
                html_text.children('.editable').css(
                    'text-indent', (html_text.children('.g').width() +
                        FASTASK.constants.pixels.assignmentindent) + 'px');
            }
        }

        // update the pager and the counts
        pager = $('.pager', FASTASK.constants.list);
        if (pager.length > 0) {
            pager.remove();
        }
        pager = $(this.response.pager).appendTo(FASTASK.constants.list);
        pager.children('a').bind('click', handle_pager_main);

        // update small numbers for the tabs
        for (k in this.response.counts) {
            $('.tabs .c', FASTASK.constants.list).eq(k)
                .html(this.response.counts[k]);
        }
    };

    /**
     * Builds a row for the main list
     * @param int i the row number in this.response.tasks
     */
    this.build_task_json = function (i) {
        var task_group, html_text, j, html_followers, json_task, html_task;
        json_task = this.response.tasks[i];
        html_task = FASTASK.constants.templates.mainrow.clone();
        if (json_task.is_done) {
            html_task.children('.s').children('input')
                .attr('checked', 'checked');
            if (this.type !== 3) {
                html_task.addClass('done');
            }
        }
        html_task.children('.s').children('input')
            .bind('click', handle_is_done);
        html_task.children('.p')
            .addClass('pri_' + json_task.priority)
            .bind('click', handle_priority);
        html_text = html_task.children('.text');
        if (json_task.group) {
            task_group = FASTASK.constants.templates.rowgroup.clone().attr('href', '#g=' +
                json_task.group.id)
                .html(json_task.group.name);
            // for ASSIGNMENTS, not allowed to change group
            if (this.type === 1) {
                task_group.html(task_group.html() + ': ')
                    .prependTo(html_text);
                html_text.addClass('nogroup');
            } else {
                task_group
                    .prependTo(html_task.children('.text')
                        .children('.editable')
                    );
                json_task.text = ': ' + json_task.text;
            }
        }
        html_text.children('.editable')
            .append(json_task.text)
            .bind('click', FASTASK.row_handler.replace_html);
        html_text.find('a')
            .bind('click', handle_editable_click);

        html_task.children('.due').children('.editable')
            .html(json_task.due_out)
            .bind('click', FASTASK.row_handler.replace_html);
        html_followers = FASTASK.constants.templates.followers.clone();
        for (j in json_task.followers) {
            html_followers.find('input.u' +
                json_task.followers[j].id).attr('checked', 'checked');
        }
        html_followers.appendTo(html_task.children('.followers'))
            .find('input').bind('click', handle_follow_action);
        html_task.children('.del')
            .children('input[name="task_id"]').val(json_task.id)
            .end()
            .children('input[name="user_id"]').val(json_task.user_id)
            .end()
            .children('a').bind('click', handle_delete);
        return html_task;
    };

    /**
     * Performs a search
     */
    this.do_search = function () {
        if (undefined === this.search_val ||
            this.search_val.length <= 0) {
            return;
        }
        $.ajax({
            type: 'GET',
            url: FASTASK.constants.paths.list +
                '?p=' + this.search_page + '&s=' + this.search_val,
            dataType: 'json',
            beforeSend: function () {
                // show searching is in progress
                $('.search-s', FASTASK.constants.list).show();
                FASTASK.list_handler.set_loading();
            },
            error: function (response, textStatus, error) {
                // remember search
                FASTASK.list_handler.last_search_q = FASTASK
			.list_handler.search_val;

                FASTASK.list_handler.unset_loading();
                $('.search-s', FASTASK.constants.list).hide();

                // if nothing found
                if (response.status === 404) {
                    $('.table', FASTASK.constants.list)
                        .children().remove().end()
                        .html('');
                    FASTASK.constants.templates.notasks.insertBefore($('.table',
                        FASTASK.constants.list));
                    return false;
                }

                // show error message
                FASTASK.notif_handler.add(2, 'Error while searching');
                return false;
            },
            success: function (response, textStatus, request) {
                // remember search
                FASTASK.list_handler.last_search_q = FASTASK
			.list_handler.search_val;

                $('.search-s', FASTASK.constants.list).hide();
                FASTASK.list_handler.unset_loading();

                // wipe previous list
                $('.table', FASTASK.constants.list)
                    .children().remove().end()
                    .html('');

                // store internals and pass on the activity
                FASTASK.list_handler.response = response;
                FASTASK.list_handler.request = request;
                FASTASK.list_handler.build_lists();

                // change the title to distinguish search results
                var url_g = '#t=' + FASTASK.list_handler.group,
                    title_g = FASTASK.constants.titles_plain[4];
                $('.title', FASTASK.constants.list)
                    .html('<a href="' + url_g + '">' +
                          title_g + '</a>');
            }
        });
    };

    /**
     * Calculate tasks per page
     */
    this.per_page = function () {
        // calculate main tasks per page
        this.main_per_page = parseInt(((FASTASK.constants.list.height() -
            FASTASK.constants.pixels.mainminus) / FASTASK.constants.pixels.rowheight), 10);
    };

    /**
     * Resizing the window causes list tables to resize
     */
    this.resize = function () {
        var reload = false;

        FASTASK.list_handler.per_page();
        // resize loading boxes
        $('.loading').each(function () {
            $(this).height($(this).parent().height() + 'px');
        });

        // check if main number changed
        if ($('.table', FASTASK.constants.list)
                .height() !== FASTASK.list_handler.main_per_page * FASTASK.constants.pixels.rowheight) {
            $('.table', FASTASK.constants.list)
                .height(FASTASK.list_handler.main_per_page * FASTASK.constants.pixels.rowheight);
            reload = true;
        }

        if (!FASTASK.url_handler.hash_last) {
            reload = true;
        }
        if (reload) {
            FASTASK.list_handler.get_lists();
        }
    };

    /**
     * Updates the groups in the main dropdown
     */
    this.update_groups = function (groups) {
        // store for convenience
        if (undefined === groups) {
            groups = this.response.groups;
        }
        if (!this.group) {
            $('.title', $('#main'))
                .html(FASTASK.constants.titles_html[this.type]);
        }
        if (this.groups_list) {
            this.groups_list.remove();
        }
        if (!groups || groups.length <= 0) {
            return;
        }
        var html_g, url_g, i, title_g;
        // clean up
        this.groups_list = FASTASK.constants.templates.groups.clone();

        for (i in groups) {
            url_g = '#g=' + groups[i].id;
            title_g = groups[i].name +
                ' (' + groups[i].num_tasks + ')';
            if (this.group && this.group === groups[i].id) {
                url_g = '#t=' + this.group;
                $('.title', $('#main'))
                    .html('<a href="' + url_g + '">' +
                        title_g +
                        '</a>');
                title_g = FASTASK.constants.titles_plain[this.type];
            }
            html_g = FASTASK.constants.templates.group.clone();
            html_g.children('a')
                .attr('href', url_g)
                .html(title_g);
            this.groups_list.append(html_g);
        }
        this.groups_list.appendTo($('.groups', FASTASK.constants.list));
        $('.groups a').bind('click', handle_change_group);
    };

    /************************************************************************/
    /**
     * jQuery events
     * After this point, all functions are called by jQuery events
     */
    /************************************************************************/

    /**
     * Callback for initiating the search
     * Updates list_handler.search_page and timeouts
     */
    handle_search_action = function (e) {
        FASTASK.list_handler.search_page = 1;
        clearTimeout(FASTASK.list_handler.search_timeout);
        var search_val = $(this).val();
        if (search_val.length < FASTASK.constants.counts.searchmin) {
            if (search_val.length <= 0) {
                if (FASTASK.list_handler.last_search_q.length > 0) {
                    FASTASK.list_handler.get_lists();
                }
                FASTASK.list_handler.last_search_q = '';
            }
            return true;
        }
        if (FASTASK.list_handler.last_search_q === search_val) {
            return true;
        }
        FASTASK.list_handler.clear_timeout();

        FASTASK.list_handler.search_timeout = setTimeout(function () {
            FASTASK.list_handler.search_val = search_val;
            FASTASK.list_handler.do_search();
        }, FASTASK.constants.timeouts.search);
    };

    /**
     * Callback main pager updates the url hash
     * Parameter: p
     */
    handle_pager_main = function () {
        var page = parseInt(FASTASK.url_handler
            .get_url_param(FASTASK.constants.params.mainpage, $(this).attr('href')), 10);
        if (FASTASK.list_handler.last_search_q.length > 0) {
            FASTASK.list_handler.search_page = page;
            FASTASK.list_handler.last_search_q = list_handler.search_val;
            FASTASK.list_handler.do_search();
        } else {
            FASTASK.url_handler.url_update_hash(FASTASK.constants.params.mainpage, page);
        }
        return false;
    };

    /**
     * Changing task.priority
     */
    handle_priority = function (e) {
        FASTASK.row_handler.update_row('priority', $(this));
        return false;
    };

    /**
     * Changing task.is_done
     */
    handle_is_done = function (e) {
        FASTASK.row_handler.update_row('is_done', $(this));
    };

    /**
     * Delete task
     */
    handle_delete = function (e) {
        FASTASK.row_handler.update_row('delete', $(this));
        return false;
    };

    /**
     * Undelete task
     */
    handle_undelete = function (e) {
        FASTASK.row_handler.update_row('undelete', $(this));
        return false;
    };

    /**
     * Editable, main
     */
    handle_editable_click = function (e) {
        if ($(this).hasClass('g')) {
            var id = $(this).attr('href').substr(3);
            FASTASK.url_handler.url_update_hash(FASTASK.constants.params.group, id, true);
            return false;
        } else if (!e.ctrlKey) {
            window.location.href = $(this).attr('href');
            return false;
        }
    };

    /**
     * Share with someone else
     */
    handle_follow_action = function (e) {
        if ($(this).is(':checked')) {
            FASTASK.row_handler.update_row('follower_add', $(this));
        } else {
            FASTASK.row_handler.update_row('follower_remove', $(this));
        }
    };

    /**
     * Changing main tabs
     */
    $('.tabs .icon', FASTASK.constants.list).click(function () {
        var type = parseInt(FASTASK.url_handler.
            get_url_param(FASTASK.constants.params.type, $(this).children('a').attr('href')),
            10);
        FASTASK.url_handler.url_update_hash(FASTASK.constants.params.type, type);
        return false;
    });

    /**
     * Changing groups
     */
    $('.title a', FASTASK.constants.list).live('click', function () {
        FASTASK.url_handler.url_update_hash(FASTASK.constants.params.mainpage, 1, true);
        return false;
    });

    /**
     * Groups update the url hash
     */
    handle_change_group = function (e) {
        var group = parseInt(FASTASK.url_handler
            .get_url_param(FASTASK.constants.params.group, $(this).attr('href')), 10);
        FASTASK.url_handler.url_update_hash(FASTASK.constants.params.group, group, true);
        return false;
    };

    /**
     * Window resize calls the resize function
     */
    $(window).resize(function () {
        clearTimeout(FASTASK.list_handler.resize_timeout);
        FASTASK.list_handler.resize_timeout = setTimeout(FASTASK.list_handler.resize,
            FASTASK.constants.timeouts.resize);
    });

    /**
     * Share with someone else
     */
    this.handle_plan_action = function (e) {
        var target = $(this);
        if (e.shiftKey) {
            FASTASK.modal_handler.show_prompt(
                'Type date and press ENTER: ' +
                '<input type="text" name="plan_custom" />',
                'plan',
                'keyup',
                function (ev) {
                    // enter
                    if (ev.keyCode === 13) {
                        FASTASK.list_handler.plan($(this).val());
                        FASTASK.constants.templates.modal.children('.jqmClose').click();
                        FASTASK.row_handler.update_row('plan', target);
                    }
                }
            );
            return false;
        }
        FASTASK.row_handler.update_row('plan', target);
        return false;
    };

    // init stuff
    $('input[name="search"]', FASTASK.constants.list).bind('keyup', handle_search_action);
    FASTASK.constants.list.appendTo('#content');
    FASTASK.constants.list.appendTo('#content');
    this.refresh_timeout = setInterval(this.refresh_all,
        FASTASK.constants.timeouts.refresh);
    this.per_page();
    $('.loading').each(function () {
        $(this).height($(this).parent().height() + 'px');
    });
}
