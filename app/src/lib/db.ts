import Dexie, { type Table } from 'dexie';
import { CONTACTS, type Contact } from './data';

class CrmDB extends Dexie {
	contacts!: Table<Contact, string>;

	constructor() {
		super('crm');
		this.version(1).stores({
			contacts: 'id, order'
		});
	}
}

export const db = new CrmDB();

export async function seedIfEmpty(): Promise<void> {
	const count = await db.contacts.count();
	if (count === 0) await db.contacts.bulkAdd(CONTACTS);
}
