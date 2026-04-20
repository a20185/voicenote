CREATE TABLE `inspirations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`summary` text NOT NULL,
	`analysis_data` text NOT NULL,
	`source_note_ids` text NOT NULL,
	`source_notes` text NOT NULL,
	`is_refined` integer DEFAULT false NOT NULL,
	`refinement_history` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
