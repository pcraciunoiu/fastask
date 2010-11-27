CREATE TABLE `common_folder` (
    `id` integer AUTO_INCREMENT NOT NULL PRIMARY KEY,
    `creator_id` integer NOT NULL,
    `name` varchar(50) NOT NULL,
    `num_tasks` integer NOT NULL,
    `created` datetime NOT NULL,
    UNIQUE (`name`, `creator_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

ALTER TABLE `common_folder` ADD CONSTRAINT `creator_id_refs_id_60fc50dd` FOREIGN KEY (`creator_id`) REFERENCES `auth_user` (`id`);

CREATE TABLE `common_task` (
    `id` integer AUTO_INCREMENT NOT NULL PRIMARY KEY,
    `text` varchar(3000) NOT NULL,
    `creator_id` integer NOT NULL,
    `folder_id` integer,
    `num_followers` integer NOT NULL,
    `due` datetime NOT NULL,
    `priority` integer NOT NULL,
    `done` bool NOT NULL,
    `is_deleted` bool NOT NULL,
    `created` datetime NOT NULL,
    `updated` datetime NOT NULL,
    `updated_by_id` integer
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

ALTER TABLE `common_task` ADD CONSTRAINT `folder_id_refs_id_787218e8` FOREIGN KEY (`folder_id`) REFERENCES `common_folder` (`id`);
ALTER TABLE `common_task` ADD CONSTRAINT `creator_id_refs_id_733ccee6` FOREIGN KEY (`creator_id`) REFERENCES `auth_user` (`id`);
ALTER TABLE `common_task` ADD CONSTRAINT `updated_by_id_refs_id_733ccee6` FOREIGN KEY (`updated_by_id`) REFERENCES `auth_user` (`id`);

CREATE TABLE `common_taskfollowing` (
    `id` integer AUTO_INCREMENT NOT NULL PRIMARY KEY,
    `user_id` integer NOT NULL,
    `task_id` integer NOT NULL,
    `created` datetime NOT NULL,
    UNIQUE (`user_id`, `task_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

ALTER TABLE `common_taskfollowing` ADD CONSTRAINT `task_id_refs_id_4c3e8b37` FOREIGN KEY (`task_id`) REFERENCES `common_task` (`id`);
ALTER TABLE `common_taskfollowing` ADD CONSTRAINT `user_id_refs_id_109c9866` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`);

CREATE TABLE `common_friendship` (
    `id` integer AUTO_INCREMENT NOT NULL PRIMARY KEY,
    `to_user_id` integer NOT NULL,
    `from_user_id` integer NOT NULL,
    `created` datetime NOT NULL,
    UNIQUE (`to_user_id`, `from_user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

ALTER TABLE `common_friendship` ADD CONSTRAINT `to_user_id_refs_id_168d5587` FOREIGN KEY (`to_user_id`) REFERENCES `auth_user` (`id`);
ALTER TABLE `common_friendship` ADD CONSTRAINT `from_user_id_refs_id_168d5587` FOREIGN KEY (`from_user_id`) REFERENCES `auth_user` (`id`);

CREATE INDEX `common_folder_685aee7` ON `common_folder` (`creator_id`);
CREATE INDEX `common_folder_52094d6e` ON `common_folder` (`name`);
CREATE INDEX `common_folder_71966673` ON `common_folder` (`num_tasks`);
CREATE INDEX `common_task_685aee7` ON `common_task` (`creator_id`);
CREATE INDEX `common_task_4e5f642` ON `common_task` (`folder_id`);
CREATE INDEX `common_task_1bd1263a` ON `common_task` (`due`);
CREATE INDEX `common_task_1923c03f` ON `common_task` (`done`);
CREATE INDEX `common_task_5e59fd4f` ON `common_task` (`is_deleted`);
CREATE INDEX `common_task_3216ff68` ON `common_task` (`created`);
CREATE INDEX `common_task_8aac229` ON `common_task` (`updated`);
CREATE INDEX `common_task_6f403c1` ON `common_task` (`updated_by_id`);
CREATE INDEX `common_taskfollowing_403f60f` ON `common_taskfollowing` (`user_id`);
CREATE INDEX `common_taskfollowing_3ff01bab` ON `common_taskfollowing` (`task_id`);
CREATE INDEX `common_friendship_315477a4` ON `common_friendship` (`to_user_id`);
CREATE INDEX `common_friendship_74b00be1` ON `common_friendship` (`from_user_id`);
