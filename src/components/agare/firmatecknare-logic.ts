import { type Shareholder, type Partner, type BoardMeeting, type OwnerInfo } from '@/data/ownership';

export interface Signatory {
    id: string;
    name: string;
    role: string;
    signatureType: 'ensam' | 'gemensam';
    validFrom: string;
    validTo?: string;
    isActive: boolean;
    source: 'shareholder' | 'partner' | 'board' | 'manual';
}

interface SignatoryData {
    shareholders: Shareholder[];
    partners: Partner[];
    boardMeetings: BoardMeeting[];
    ownerInfo: OwnerInfo;
}

export function deriveSignatories(companyType: string, data: SignatoryData): Signatory[] {
    const result: Signatory[] = [];
    const { shareholders, partners, boardMeetings, ownerInfo } = data;

    if (companyType === 'ab') {
        // For AB: Major shareholders (>50%) and board members can sign
        const majorShareholders = shareholders.filter(s => s.ownershipPercentage >= 50);

        majorShareholders.forEach(s => {
            result.push({
                id: s.id,
                name: s.name,
                role: `Aktieägare (${s.ownershipPercentage}%)`,
                signatureType: 'ensam',
                validFrom: s.acquisitionDate,
                isActive: true,
                source: 'shareholder',
            });
        });

        // Add VD/CEO and board members from latest board meeting
        const latestMeeting = boardMeetings.find(m => m.status === 'protokoll signerat');
        if (latestMeeting) {
            // Chairperson can sign alone
            result.push({
                id: `board-${latestMeeting.chairperson}`,
                name: latestMeeting.chairperson,
                role: 'Styrelsens ordförande',
                signatureType: 'ensam',
                validFrom: latestMeeting.date,
                isActive: true,
                source: 'board',
            });

            // Other board members sign together
            latestMeeting.attendees
                .filter(a => a !== latestMeeting.chairperson)
                .forEach(attendee => {
                    result.push({
                        id: `board-${attendee}`,
                        name: attendee,
                        role: 'Styrelseledamot',
                        signatureType: 'gemensam',
                        validFrom: latestMeeting.date,
                        isActive: true,
                        source: 'board',
                    });
                });
        }
    } else if (companyType === 'hb' || companyType === 'kb') {
        // For HB/KB: Komplementärer can sign
        const effectivePartners = companyType === 'kb'
            ? ownerInfo.partners || []
            : partners;

        effectivePartners.forEach((p: Partner) => {
            const canSignAlone = p.type === 'komplementär' && p.ownershipPercentage >= 50;
            result.push({
                id: p.id,
                name: p.name,
                role: p.type === 'komplementär' ? 'Komplementär' : 'Kommanditdelägare',
                signatureType: canSignAlone ? 'ensam' : 'gemensam',
                validFrom: p.joinDate,
                isActive: !p.isLimitedLiability, // Kommanditdelägare can't sign
                source: 'partner',
            });
        });
    } else if (companyType === 'forening') {
        // For Förening: Board members from mockOwnerInfo
        const boardMembers = ownerInfo.boardMembers;
        boardMembers?.forEach((member: { name: string; role: string; since: string }, idx: number) => {
            result.push({
                id: `member-${idx}`,
                name: member.name,
                role: member.role,
                signatureType: member.role === 'Ordförande' ? 'ensam' : 'gemensam',
                validFrom: member.since,
                isActive: true,
                source: 'board',
            });
        });
    } else if (companyType === 'ef') {
        // For EF: Only the owner can sign
        const owner = ownerInfo.owner;
        if (owner) {
            result.push({
                id: 'owner',
                name: owner.name,
                role: 'Innehavare',
                signatureType: 'ensam',
                validFrom: '2020-01-01', // Could be from registration
                isActive: true,
                source: 'manual',
            });
        }
    }

    // Remove duplicates by name
    const uniqueByName = result.filter((s, idx, arr) =>
        arr.findIndex(x => x.name === s.name) === idx
    );

    return uniqueByName;
}
