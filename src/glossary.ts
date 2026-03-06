export interface GlossaryEntry {
    label: string;
    tooltip: string;
}

export const glossary: Record<string, GlossaryEntry> = {
    businessDiscovery: {
        label: 'Business Discovery',
        tooltip: 'A guided interview to understand your business, customers, and what you sell — so the system can suggest marketing strategies.',
    },
    offer: {
        label: 'Offer',
        tooltip: 'The specific product, service, or deal you want to promote to potential customers.',
    },
    icp: {
        label: 'Ideal Customer Profile',
        tooltip: 'A description of the exact type of person most likely to buy from you — their job, problems, and goals.',
    },
    campaign: {
        label: 'Campaign',
        tooltip: 'A coordinated set of ads, posts, and messages designed to attract customers over a specific time period.',
    },
    funnel: {
        label: 'Funnel',
        tooltip: 'The journey a stranger takes to become a customer — from first hearing about you, to considering your offer, to making a decision.',
    },
    awareness: {
        label: 'Awareness',
        tooltip: 'The top of the funnel — getting your brand in front of people who don\'t know you yet.',
    },
    consideration: {
        label: 'Consideration',
        tooltip: 'The middle of the funnel — people know about you and are comparing options.',
    },
    decision: {
        label: 'Decision',
        tooltip: 'The bottom of the funnel — people are ready to buy and need a final push.',
    },
    cta: {
        label: 'Call to Action',
        tooltip: 'The specific action you want someone to take — like "Book a Call", "Download the Guide", or "Buy Now".',
    },
    copy: {
        label: 'Copy',
        tooltip: 'The written text used in ads, emails, and social posts to persuade people to take action.',
    },
    variant: {
        label: 'Variant',
        tooltip: 'A different version of the same message — used to test which wording works best.',
    },
    channel: {
        label: 'Channel',
        tooltip: 'Where your message appears — like Facebook, LinkedIn, email, or X (Twitter).',
    },
    channelMeta: {
        label: 'Meta (Facebook/Instagram)',
        tooltip: 'Ads and posts on Facebook and Instagram, owned by Meta. Great for broad awareness and visual content.',
    },
    channelLinkedin: {
        label: 'LinkedIn',
        tooltip: 'Professional network — best for B2B marketing, thought leadership, and reaching decision-makers.',
    },
    channelX: {
        label: 'X (Twitter)',
        tooltip: 'Short-form social platform — good for quick updates, engagement, and real-time conversations.',
    },
    channelEmail: {
        label: 'Email',
        tooltip: 'Direct messages to people who opted in — one of the highest-converting marketing channels.',
    },
    reviewQueue: {
        label: 'Review Queue',
        tooltip: 'A holding area where ads and replies wait for a human to approve them before they go live.',
    },
    publishing: {
        label: 'Publishing',
        tooltip: 'Sending your approved content live on a social platform or email at a scheduled time.',
    },
    schedule: {
        label: 'Schedule',
        tooltip: 'Pick a future date and time for your content to go live automatically.',
    },
    commentTriage: {
        label: 'Comment Triage',
        tooltip: 'Sorting incoming comments by type — is this person a potential customer, a supporter, someone with concerns, or spam?',
    },
    intentLead: {
        label: 'Lead',
        tooltip: 'A person who might become a paying customer — they\'ve shown interest in what you offer.',
    },
    intentSupport: {
        label: 'Support',
        tooltip: 'A positive comment from someone who likes your brand — great for social proof.',
    },
    intentObjection: {
        label: 'Objection',
        tooltip: 'A concern or pushback from a potential customer — like "too expensive" or "not sure it works".',
    },
    intentSpam: {
        label: 'Spam',
        tooltip: 'Junk comments from bots or scammers — automatically flagged and skipped.',
    },
    cpl: {
        label: 'Cost Per Lead',
        tooltip: 'How much money you spend on ads to get one potential customer to respond. Lower is better.',
    },
    roas: {
        label: 'Return on Ad Spend',
        tooltip: 'How much revenue you earn for every dollar spent on advertising. A 3x ROAS means $3 earned per $1 spent.',
    },
    attribution: {
        label: 'Attribution',
        tooltip: 'Figuring out which ad, post, or channel actually caused someone to become a customer.',
    },
    conversionRate: {
        label: 'Conversion Rate',
        tooltip: 'The percentage of people who took the desired action — like clicking, signing up, or buying.',
    },
    impressions: {
        label: 'Impressions',
        tooltip: 'The number of times your ad or post was shown to someone — even if they didn\'t click.',
    },
    clicks: {
        label: 'Clicks',
        tooltip: 'The number of times someone clicked on your ad or post to learn more.',
    },
    mockMode: {
        label: 'Mock Mode',
        tooltip: 'You\'re seeing simulated data — nothing is connected to real platforms yet. Use this to learn how the system works.',
    },
    generateCopy: {
        label: 'Generate Copy',
        tooltip: 'Create multiple versions of ad/post text for each channel, tailored to your offer and audience.',
    },
    approve: {
        label: 'Approve',
        tooltip: 'Mark this content as ready to go live. Nothing gets published without your approval.',
    },
    reject: {
        label: 'Reject',
        tooltip: 'Send this content back for revision. It won\'t be published.',
    },
    draftReply: {
        label: 'Draft Reply',
        tooltip: 'An AI-suggested response to a comment — you can edit or approve it before sending.',
    },
    offerHypothesis: {
        label: 'Offer Suggestion',
        tooltip: 'A recommended product or deal the system thinks would resonate with your target audience, based on your business interview.',
    },
    confidence: {
        label: 'Confidence Score',
        tooltip: 'How confident the system is in this suggestion — higher means more evidence supports it.',
    },
    policyVersion: {
        label: 'Policy Version',
        tooltip: 'The set of rules (length limits, banned words, tone guidelines) used when generating this copy.',
    },
    score: {
        label: 'Quality Score',
        tooltip: 'A rating of how well this copy variant follows best practices — clarity, length, call to action strength.',
    },
    strategyWorkspace: {
        label: 'Strategy Workspace',
        tooltip: 'A side-by-side view of your business profile and offer options — use it to confirm what you\'re promoting before building a campaign.',
    },
    starterPreset: {
        label: 'Starter Example',
        tooltip: 'A pre-filled example business you can load to practice using the system. No real data required — just explore how campaigns are built.',
    },
    advisoryState: {
        label: 'Advisory State',
        tooltip: 'The status of AI-assisted output in the workflow: suggested, in review, approved, or rejected. Advisory means it still needs your judgment.',
    },
    approvalGate: {
        label: 'Approval Gate',
        tooltip: 'The required review checkpoint that blocks sending, scheduling, or publishing until you explicitly approve the item.',
    },
};

export function getTooltip(key: string): string {
    return glossary[key]?.tooltip || '';
}

export function getLabel(key: string): string {
    return glossary[key]?.label || key;
}
