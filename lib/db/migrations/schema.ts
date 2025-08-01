import { pgTable, uuid, varchar, foreignKey, timestamp, text, boolean, json, pgSchema, integer, uniqueIndex, bigint, index, jsonb, primaryKey } from "drizzle-orm/pg-core"
  import { sql } from "drizzle-orm"

export const storage = pgSchema("storage");



export const user = pgTable("User", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: varchar({ length: 64 }).notNull(),
	password: varchar({ length: 64 }),
});

export const suggestion = pgTable("Suggestion", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	documentId: uuid().notNull(),
	documentCreatedAt: timestamp({ mode: 'string' }).notNull(),
	originalText: text().notNull(),
	suggestedText: text().notNull(),
	description: text(),
	isResolved: boolean().default(false).notNull(),
	userId: uuid().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
},
(table) => {
	return {
		suggestionDocumentIdDocumentCreatedAtDocumentIdCreatedAtF: foreignKey({
			columns: [table.documentId, table.documentCreatedAt],
			foreignColumns: [document.id, document.createdAt],
			name: "Suggestion_documentId_documentCreatedAt_Document_id_createdAt_f"
		}),
		suggestionUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Suggestion_userId_User_id_fk"
		}),
	}
});

export const message = pgTable("Message", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	chatId: uuid().notNull(),
	role: varchar().notNull(),
	content: json().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
},
(table) => {
	return {
		messageChatIdChatIdFk: foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "Message_chatId_Chat_id_fk"
		}),
	}
});

export const chat = pgTable("Chat", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
	userId: uuid().notNull(),
	title: text().notNull(),
	visibility: varchar().default('private').notNull(),
},
(table) => {
	return {
		chatUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Chat_userId_User_id_fk"
		}),
	}
});

export const messageV2 = pgTable("Message_v2", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	chatId: uuid().notNull(),
	role: varchar().notNull(),
	parts: json().notNull(),
	attachments: json().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
},
(table) => {
	return {
		messageV2ChatIdChatIdFk: foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "Message_v2_chatId_Chat_id_fk"
		}),
	}
});

export const stream = pgTable("Stream", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	chatId: uuid().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
},
(table) => {
	return {
		streamChatIdChatIdFk: foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "Stream_chatId_Chat_id_fk"
		}),
	}
});

export const migrationsInStorage = storage.table("migrations", {
	id: integer().notNull(),
	name: varchar({ length: 100 }).notNull(),
	hash: varchar({ length: 40 }).notNull(),
	executedAt: timestamp("executed_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
});

export const bucketsInStorage = storage.table("buckets", {
	id: text().notNull(),
	name: text().notNull(),
	owner: uuid(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	public: boolean().default(false),
	avifAutodetection: boolean("avif_autodetection").default(false),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	fileSizeLimit: bigint("file_size_limit", { mode: "number" }),
	allowedMimeTypes: text("allowed_mime_types").array(),
	ownerId: text("owner_id"),
},
(table) => {
	return {
		bname: uniqueIndex("bname").using("btree", table.name.asc().nullsLast()),
	}
});

export const s3MultipartUploadsPartsInStorage = storage.table("s3_multipart_uploads_parts", {
	id: uuid().defaultRandom().notNull(),
	uploadId: text("upload_id").notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	size: bigint({ mode: "number" }).default(0).notNull(),
	partNumber: integer("part_number").notNull(),
	bucketId: text("bucket_id").notNull(),
	key: text().notNull(),
	etag: text().notNull(),
	ownerId: text("owner_id"),
	version: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
},
(table) => {
	return {
		s3MultipartUploadsPartsBucketIdFkey: foreignKey({
			columns: [table.bucketId],
			foreignColumns: [bucketsInStorage.id],
			name: "s3_multipart_uploads_parts_bucket_id_fkey"
		}),
		s3MultipartUploadsPartsUploadIdFkey: foreignKey({
			columns: [table.uploadId],
			foreignColumns: [s3MultipartUploadsInStorage.id],
			name: "s3_multipart_uploads_parts_upload_id_fkey"
		}).onDelete("cascade"),
	}
});

export const objectsInStorage = storage.table("objects", {
	id: uuid().defaultRandom().notNull(),
	bucketId: text("bucket_id"),
	name: text(),
	owner: uuid(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	lastAccessedAt: timestamp("last_accessed_at", { withTimezone: true, mode: 'string' }).defaultNow(),
	metadata: jsonb(),
	pathTokens: text("path_tokens").array().generatedAlwaysAs(sql`string_to_array(name, '/'::text)`),
	version: text(),
	ownerId: text("owner_id"),
	userMetadata: jsonb("user_metadata"),
},
(table) => {
	return {
		bucketidObjname: uniqueIndex("bucketid_objname").using("btree", table.bucketId.asc().nullsLast(), table.name.asc().nullsLast()),
		idxObjectsBucketIdName: index("idx_objects_bucket_id_name").using("btree", table.bucketId.asc().nullsLast(), table.name.asc().nullsLast()),
		namePrefixSearch: index("name_prefix_search").using("btree", table.name.asc().nullsLast()),
		objectsBucketIdFkey: foreignKey({
			columns: [table.bucketId],
			foreignColumns: [bucketsInStorage.id],
			name: "objects_bucketId_fkey"
		}),
	}
});

export const s3MultipartUploadsInStorage = storage.table("s3_multipart_uploads", {
	id: text().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	inProgressSize: bigint("in_progress_size", { mode: "number" }).default(0).notNull(),
	uploadSignature: text("upload_signature").notNull(),
	bucketId: text("bucket_id").notNull(),
	key: text().notNull(),
	version: text().notNull(),
	ownerId: text("owner_id"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	userMetadata: jsonb("user_metadata"),
},
(table) => {
	return {
		idxMultipartUploadsList: index("idx_multipart_uploads_list").using("btree", table.bucketId.asc().nullsLast(), table.key.asc().nullsLast(), table.createdAt.asc().nullsLast()),
		s3MultipartUploadsBucketIdFkey: foreignKey({
			columns: [table.bucketId],
			foreignColumns: [bucketsInStorage.id],
			name: "s3_multipart_uploads_bucket_id_fkey"
		}),
	}
});

export const vote = pgTable("Vote", {
	chatId: uuid().notNull(),
	messageId: uuid().notNull(),
	isUpvoted: boolean().notNull(),
},
(table) => {
	return {
		voteChatIdChatIdFk: foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "Vote_chatId_Chat_id_fk"
		}),
		voteMessageIdMessageIdFk: foreignKey({
			columns: [table.messageId],
			foreignColumns: [message.id],
			name: "Vote_messageId_Message_id_fk"
		}),
		voteChatIdMessageIdPk: primaryKey({ columns: [table.chatId, table.messageId], name: "Vote_chatId_messageId_pk"}),
	}
});

export const voteV2 = pgTable("Vote_v2", {
	chatId: uuid().notNull(),
	messageId: uuid().notNull(),
	isUpvoted: boolean().notNull(),
},
(table) => {
	return {
		voteV2ChatIdChatIdFk: foreignKey({
			columns: [table.chatId],
			foreignColumns: [chat.id],
			name: "Vote_v2_chatId_Chat_id_fk"
		}),
		voteV2MessageIdMessageV2IdFk: foreignKey({
			columns: [table.messageId],
			foreignColumns: [messageV2.id],
			name: "Vote_v2_messageId_Message_v2_id_fk"
		}),
		voteV2ChatIdMessageIdPk: primaryKey({ columns: [table.chatId, table.messageId], name: "Vote_v2_chatId_messageId_pk"}),
	}
});

export const document = pgTable("Document", {
	id: uuid().defaultRandom().notNull(),
	createdAt: timestamp({ mode: 'string' }).notNull(),
	title: text().notNull(),
	content: text(),
	userId: uuid().notNull(),
	text: varchar().default('text').notNull(),
},
(table) => {
	return {
		documentUserIdUserIdFk: foreignKey({
			columns: [table.userId],
			foreignColumns: [user.id],
			name: "Document_userId_User_id_fk"
		}),
		documentIdCreatedAtPk: primaryKey({ columns: [table.id, table.createdAt], name: "Document_id_createdAt_pk"}),
	}
});