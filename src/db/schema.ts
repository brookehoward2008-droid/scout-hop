import { boolean, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const youthEvents = pgTable('youth_events', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  category: text('category').notNull(),
  county: text('county').notNull(),
  city: text('city').notNull(),
  isFree: boolean('is_free').default(true),
  freeDetails: text('free_details'),
  description: text('description').notNull(),
  tags: jsonb('tags').$type<string[]>(),
  link: text('link'),
  pubDate: text('pub_date'),
  createdAt: timestamp('created_at').defaultNow(),
});
