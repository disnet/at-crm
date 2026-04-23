export type SourceKey = 'bluesky' | 'email' | 'telegram' | 'signal' | 'notes';

export type SourceConfig = {
	label: string;
	color: string;
	bg: string;
};

export const SOURCES: Record<SourceKey, SourceConfig> = {
	bluesky:  { label: 'Bluesky',  color: 'var(--src-bluesky)',  bg: 'var(--src-bluesky-bg)' },
	email:    { label: 'Email',    color: 'var(--src-email)',    bg: 'var(--src-email-bg)' },
	telegram: { label: 'Telegram', color: 'var(--src-telegram)', bg: 'var(--src-telegram-bg)' },
	signal:   { label: 'Signal',   color: 'var(--src-signal)',   bg: 'var(--src-signal-bg)' },
	notes:    { label: 'Notes',    color: 'var(--src-notes)',    bg: 'var(--src-notes-bg)' }
};

export type Message = {
	id: string;
	dir: 'in' | 'out';
	text: string;
	ts: string;
	date?: string;
	subject?: string;
};

export type NoteEntry = {
	id: string;
	type: 'note' | 'call' | 'reminder' | 'meeting';
	text: string;
	ts: string;
	isPinned?: boolean;
};

export type ContactReminder = {
	text: string;
	due: string;
};

export type Contact = {
	id: string;
	name: string;
	initials: string;
	avatarColor: string;
	tagline: string;
	location?: string;
	birthday?: string;
	url?: string;
	sources: SourceKey[];
	lastMsg: string;
	lastActive: string;
	unread: number;
	reminder: ContactReminder | null;
	threads: Partial<Record<SourceKey, (Message | NoteEntry)[]>>;
};

export const CONTACTS: Contact[] = [
	{
		id: 'alex',
		name: 'Alex Chen',
		initials: 'AC',
		avatarColor: 'oklch(72% 0.13 200)',
		tagline: 'Product Designer · Figma',
		location: 'San Francisco, CA',
		birthday: 'March 14',
		url: 'alexchen.design',
		sources: ['bluesky', 'email', 'notes'],
		lastMsg: 'Hoping to, need to convince work 😅',
		lastActive: '2m ago',
		unread: 0,
		reminder: { text: 'Follow up about workshop collab', due: 'Tomorrow' },
		threads: {
			bluesky: [
				{ id: 'b1', dir: 'in',  text: 'Just posted about design token naming — would love your takes 👀', ts: '2:14 PM', date: 'Today' },
				{ id: 'b2', dir: 'out', text: 'The section on semantic aliases was exactly what I needed this week', ts: '2:31 PM', date: 'Today' },
				{ id: 'b3', dir: 'in',  text: 'Ha, glad it landed! Going to Config this year?', ts: '2:33 PM', date: 'Today' },
				{ id: 'b4', dir: 'out', text: 'Hoping to, need to convince work to sponsor the ticket 😅', ts: '2:45 PM', date: 'Today' }
			],
			email: [
				{ id: 'e1', dir: 'in',  text: 'Circling back on the collab idea from the meetup. Happy to hop on a call?', ts: '9:02 AM', date: 'Mon', subject: 'Re: Design collab' },
				{ id: 'e2', dir: 'out', text: 'Yes! Next week works great. Thursday afternoon?', ts: '11:30 AM', date: 'Mon', subject: 'Re: Design collab' },
				{ id: 'e3', dir: 'in',  text: "Perfect. I'll send a cal invite — looking forward!", ts: '12:15 PM', date: 'Mon', subject: 'Re: Design collab' }
			],
			notes: [
				{ id: 'n1', type: 'note', text: 'Met at SF Design Week 2024. Works on Figma components team. Keen to co-write about design systems.', ts: 'Dec 12, 2024' },
				{ id: 'n2', type: 'call', text: "30 min call — discussed Q1 workshop collab. She's interested, needs manager sign-off.", ts: 'Jan 8, 2025' },
				{ id: 'n3', type: 'reminder', text: 'Follow up about workshop collab', ts: 'Apr 24, 2025', isPinned: true }
			]
		}
	},
	{
		id: 'maria',
		name: 'Maria Santos',
		initials: 'MS',
		avatarColor: 'oklch(68% 0.13 30)',
		tagline: 'Research Lead · Anthropic',
		location: 'New York, NY',
		birthday: 'July 22',
		url: 'mariasantos.io',
		sources: ['email', 'telegram'],
		lastMsg: 'Yep, 28th. No rush — revisions are small',
		lastActive: '1h ago',
		unread: 2,
		reminder: null,
		threads: {
			email: [
				{ id: 'e4', dir: 'in',  text: 'The paper draft is looking great — a few minor comments in the doc', ts: '8:45 AM', date: 'Today', subject: 'Re: Paper draft' },
				{ id: 'e5', dir: 'out', text: 'Thanks! Will address those tonight. Is submission still the 28th?', ts: '10:00 AM', date: 'Today', subject: 'Re: Paper draft' },
				{ id: 'e6', dir: 'in',  text: 'Yep, 28th. No rush — revisions are small', ts: '10:22 AM', date: 'Today', subject: 'Re: Paper draft' }
			],
			telegram: [
				{ id: 't1', dir: 'out', text: 'Did you see the new Anthropic announcement?', ts: '6:15 PM', date: 'Yesterday' },
				{ id: 't2', dir: 'in',  text: "Oh trust me I've been living inside it for weeks haha", ts: '6:44 PM', date: 'Yesterday' },
				{ id: 't3', dir: 'in',  text: 'The eval work alone was months of effort', ts: '6:45 PM', date: 'Yesterday' }
			]
		}
	},
	{
		id: 'jordan',
		name: 'Jordan Lee',
		initials: 'JL',
		avatarColor: 'oklch(68% 0.13 140)',
		tagline: 'Indie hacker · prev Stripe',
		location: 'Remote',
		birthday: 'Nov 3',
		sources: ['telegram', 'notes'],
		lastMsg: 'Shipped the first paying customer!! 🎉',
		lastActive: '3h ago',
		unread: 1,
		reminder: { text: 'Check in on startup progress', due: 'This week' },
		threads: {
			telegram: [
				{ id: 't4', dir: 'in',  text: 'Shipped the first paying customer!! 🎉', ts: '3:12 PM', date: 'Yesterday' },
				{ id: 't5', dir: 'out', text: "NO WAY that's huge!! Tell me everything", ts: '3:45 PM', date: 'Yesterday' },
				{ id: 't6', dir: 'in',  text: 'A small B2B contract but it feels surreal after 6 months of building', ts: '4:01 PM', date: 'Yesterday' },
				{ id: 't7', dir: 'out', text: "Dinner is on me next time I'm in town", ts: '4:03 PM', date: 'Yesterday' }
			],
			notes: [
				{ id: 'n4', type: 'note', text: 'Left Stripe in Jan to build a B2B analytics tool. Early stages, ambitious roadmap.', ts: 'Feb 3, 2025' }
			]
		}
	},
	{
		id: 'priya',
		name: 'Priya Nair',
		initials: 'PN',
		avatarColor: 'oklch(68% 0.13 285)',
		tagline: 'Partner · Sequoia',
		location: 'Menlo Park, CA',
		birthday: 'Sep 9',
		url: 'sequoiacap.com',
		sources: ['email', 'bluesky'],
		lastMsg: 'Morning is perfect. Blue Bottle at 9?',
		lastActive: '2d ago',
		unread: 0,
		reminder: { text: 'Coffee May 2nd — confirm time', due: 'May 1' },
		threads: {
			email: [
				{ id: 'e7', dir: 'out', text: "Would love to grab coffee next time you're in the city — I have some updates", ts: 'Apr 18', date: 'Apr 18', subject: 'Coffee?' },
				{ id: 'e8', dir: 'in',  text: "Absolutely! I'll be in SF May 2nd. Morning works?", ts: 'Apr 20', date: 'Apr 20', subject: 'Re: Coffee?' },
				{ id: 'e9', dir: 'out', text: 'Morning is perfect. Blue Bottle at 9?', ts: 'Apr 21', date: 'Apr 21', subject: 'Re: Coffee?' }
			],
			bluesky: [
				{ id: 'b5', dir: 'in',  text: 'Great panel at SaaStr — your point about defensibility really resonated', ts: 'Apr 15', date: 'Apr 15' },
				{ id: 'b6', dir: 'out', text: 'Thanks! The Sequoia portfolio talk was fantastic btw', ts: 'Apr 15', date: 'Apr 15' }
			]
		}
	},
	{
		id: 'sam',
		name: 'Sam Park',
		initials: 'SP',
		avatarColor: 'oklch(65% 0.12 60)',
		tagline: 'Staff Eng · Linear',
		location: 'Seattle, WA',
		birthday: 'Jan 30',
		sources: ['email', 'notes'],
		lastMsg: 'How did you land on that swimlane layout?',
		lastActive: '1w ago',
		unread: 0,
		reminder: { text: 'Send article on distributed systems', due: 'This week' },
		threads: {
			email: [
				{ id: 'e10', dir: 'in',  text: 'The Linear public roadmap is live! Curious about your takes after using it', ts: 'Apr 15', date: 'Apr 15', subject: 'Linear roadmap' },
				{ id: 'e11', dir: 'out', text: 'Looked at it! The swimlane view is really elegant. How did you land on that layout?', ts: 'Apr 16', date: 'Apr 16', subject: 'Re: Linear roadmap' }
			],
			notes: [
				{ id: 'n5', type: 'note', text: 'Met at Strange Loop 2023. Deep background in distributed systems and consensus protocols.', ts: 'Oct 3, 2023' },
				{ id: 'n6', type: 'call', text: 'Quick catch-up. Leading a major infra rewrite at Linear. Sounds intense.', ts: 'Mar 10, 2025' }
			]
		}
	},
	{
		id: 'charlie',
		name: 'Charlie Davis',
		initials: 'CD',
		avatarColor: 'oklch(68% 0.1 322)',
		tagline: 'Writer · Substack',
		location: 'London, UK',
		birthday: 'May 17',
		url: 'charliedavis.substack.com',
		sources: ['email', 'notes'],
		lastMsg: 'No pressure — just thinking out loud!',
		lastActive: '3d ago',
		unread: 3,
		reminder: null,
		threads: {
			email: [
				{ id: 'e12', dir: 'in',  text: 'Really appreciated your comment on the last piece — the nuance you added was great', ts: 'Apr 20', date: 'Apr 20', subject: 'Re: Your comment' },
				{ id: 'e13', dir: 'out', text: 'It was a great piece! The argument around platform accountability hit home', ts: 'Apr 20', date: 'Apr 20', subject: 'Re: Your comment' },
				{ id: 'e14', dir: 'in',  text: "I'm working on a follow-up — would you be up for a quick chat to stress-test some ideas?", ts: 'Apr 21', date: 'Apr 21', subject: 'Re: Your comment' },
				{ id: 'e15', dir: 'in',  text: 'No pressure — just thinking out loud!', ts: 'Apr 21', date: 'Apr 21', subject: 'Re: Your comment' }
			],
			notes: [
				{ id: 'n7', type: 'note', text: 'Brilliant essayist. Met online through mutual follows. Deep thinker on tech + society.', ts: 'Nov 2024' }
			]
		}
	}
];

export function isNote(entry: Message | NoteEntry): entry is NoteEntry {
	return 'type' in entry;
}

export function isMessage(entry: Message | NoteEntry): entry is Message {
	return 'dir' in entry;
}
