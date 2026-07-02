import { Gender } from './gender';

export enum Rank {
    // ----- Men (main ladder, lowest -> highest) -----
    BROTHER = 'Brother',
    ANOINTED_BROTHER = 'Anointed Brother',
    ELDER = 'Elder',
    CAPE_ELDER_BROTHER = 'Cape Elder Brother',
    SENIOR_ELDER = 'Senior Elder',
    ASSISTANT_LEADER = 'Assistant Leader',
    LEADER = 'Leader',
    SENIOR_LEADER = 'Senior Leader',
    SUPERIOR_SENIOR_LEADER = 'Superior Senior Leader',
    ASSISTANT_EVANGELIST = 'Assistant Evangelist',
    EVANGELIST = 'Evangelist',
    HONORARY_SENIOR_EVANGELIST = 'Honorary Senior Evangelist',
    SENIOR_EVANGELIST = 'Senior Evangelist',
    MOST_SENIOR_EVANGELIST = 'Most Senior Evangelist',
    SUPERIOR_EVANGELIST = 'Superior Evangelist',
    SUPREME_EVANGELIST = 'Supreme Evangelist',
    PASTOR_CCC_WORLDWIDE = 'Pastor C.C.C. Worldwide',
    // ----- Men (parallel ladder) -----
    WOLI = 'Woli',
    WOLIJAH = 'Wolijah',
    WOLEADER = 'Woleader',
    SENIOR_WOLEADER = 'Senior Woleader',
    SUPERIOR_SENIOR_WOLEADER = 'Superior Senior Woleader',
    // ----- Women (main ladder, lowest -> highest) -----
    SISTER = 'Sister',
    ELDER_SISTER = 'Elder Sister',
    CAPE_ELDER_SISTER = 'Cape Elder Sister',
    SENIOR_ELDER_SISTER = 'Senior Elder Sister',
    SUPERIOR_SENIOR_ELDER_SISTER = 'Superior Senior Elder Sister',
    LACE_SUPERIOR_SENIOR_ELDER_SISTER = 'Lace Superior Senior Elder Sister',
    // ----- Women (parallel ladder) -----
    PROPHETESS = 'Prophetess',
    CAPE_ELDER_PROPHETESS = 'Cape Elder Prophetess',
    SENIOR_PROPHETESS = 'Senior Prophetess',
    SUPERIOR_SENIOR_PROPHETESS = 'Superior Senior Prophetess',
}

// Seniority number within each gender (parallel ranks share a number).
export const RANK_NUMBER: Record<Rank, number> = {
    [Rank.BROTHER]: 1,
    [Rank.ANOINTED_BROTHER]: 2,
    [Rank.ELDER]: 3,
    [Rank.CAPE_ELDER_BROTHER]: 4,
    [Rank.SENIOR_ELDER]: 5,
    [Rank.ASSISTANT_LEADER]: 6,
    [Rank.LEADER]: 7,
    [Rank.SENIOR_LEADER]: 8,
    [Rank.SUPERIOR_SENIOR_LEADER]: 9,
    [Rank.ASSISTANT_EVANGELIST]: 10,
    [Rank.EVANGELIST]: 11,
    [Rank.HONORARY_SENIOR_EVANGELIST]: 12,
    [Rank.SENIOR_EVANGELIST]: 13,
    [Rank.MOST_SENIOR_EVANGELIST]: 14,
    [Rank.SUPERIOR_EVANGELIST]: 15,
    [Rank.SUPREME_EVANGELIST]: 16,
    [Rank.PASTOR_CCC_WORLDWIDE]: 17,
    [Rank.WOLI]: 3,
    [Rank.WOLIJAH]: 4,
    [Rank.WOLEADER]: 7,
    [Rank.SENIOR_WOLEADER]: 8,
    [Rank.SUPERIOR_SENIOR_WOLEADER]: 9,
    [Rank.SISTER]: 1,
    [Rank.ELDER_SISTER]: 2,
    [Rank.CAPE_ELDER_SISTER]: 3,
    [Rank.SENIOR_ELDER_SISTER]: 4,
    [Rank.SUPERIOR_SENIOR_ELDER_SISTER]: 5,
    [Rank.LACE_SUPERIOR_SENIOR_ELDER_SISTER]: 6,
    [Rank.PROPHETESS]: 2,
    [Rank.CAPE_ELDER_PROPHETESS]: 3,
    [Rank.SENIOR_PROPHETESS]: 4,
    [Rank.SUPERIOR_SENIOR_PROPHETESS]: 5,
};

/** Reverse lookup: the gender implied by a rank title, or null if unknown. */
export function rankGender(rank?: string | null): Gender | null {
    if (!rank) return null;
    const r = rank.trim();
    if ((RANKS_BY_GENDER[Gender.MALE] as string[]).includes(r)) return Gender.MALE;
    if ((RANKS_BY_GENDER[Gender.FEMALE] as string[]).includes(r)) return Gender.FEMALE;
    return null;
}

// Dropdown options per gender (highest -> lowest, with parallel ranks after).
export const RANKS_BY_GENDER: Record<Gender, Rank[]> = {
    [Gender.MALE]: [
        Rank.PASTOR_CCC_WORLDWIDE,
        Rank.SUPREME_EVANGELIST,
        Rank.SUPERIOR_EVANGELIST,
        Rank.MOST_SENIOR_EVANGELIST,
        Rank.SENIOR_EVANGELIST,
        Rank.HONORARY_SENIOR_EVANGELIST,
        Rank.EVANGELIST,
        Rank.ASSISTANT_EVANGELIST,
        Rank.SUPERIOR_SENIOR_LEADER,
        Rank.SENIOR_LEADER,
        Rank.LEADER,
        Rank.ASSISTANT_LEADER,
        Rank.SENIOR_ELDER,
        Rank.CAPE_ELDER_BROTHER,
        Rank.ELDER,
        Rank.ANOINTED_BROTHER,
        Rank.BROTHER,
        // parallel ladder
        Rank.SUPERIOR_SENIOR_WOLEADER,
        Rank.SENIOR_WOLEADER,
        Rank.WOLEADER,
        Rank.WOLIJAH,
        Rank.WOLI,
    ],
    [Gender.FEMALE]: [
        Rank.LACE_SUPERIOR_SENIOR_ELDER_SISTER,
        Rank.SUPERIOR_SENIOR_ELDER_SISTER,
        Rank.SENIOR_ELDER_SISTER,
        Rank.CAPE_ELDER_SISTER,
        Rank.ELDER_SISTER,
        Rank.SISTER,
        // parallel ladder
        Rank.SUPERIOR_SENIOR_PROPHETESS,
        Rank.SENIOR_PROPHETESS,
        Rank.CAPE_ELDER_PROPHETESS,
        Rank.PROPHETESS,
    ],
};
