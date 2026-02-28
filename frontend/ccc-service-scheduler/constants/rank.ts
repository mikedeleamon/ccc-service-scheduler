import { Gender } from './gender';
export enum Rank {
    SHEPHERD_IN_CHARGE = 'Shepherd in Charge',
    MOST_VENERABLE_SUPERIOR_EVANGELIST = 'Most Venerable Superior Evangelist',
    VENERABLE_SUPERIOR_EVANGELIST = 'Venerable Superior Evangelist',
    MOTHER_CELESTIAL = 'Mother Celestial',
    SUPERIOR_EVANGELIST = 'Superior Evangelist',
    CAPE_ELDER_SISTER = 'Cape Elder Sister',
    CAPE_ELDER_BROTHER = 'Cape Elder Brother',
    BROTHER = 'Brother',
    SISTER = 'Sister',
    EVANGELIST = 'Assistant Evangelist',
}

export const RANKS_BY_GENDER: Record<Gender, Rank[]> = {
    [Gender.MALE]: [
        Rank.SHEPHERD_IN_CHARGE,
        Rank.MOST_VENERABLE_SUPERIOR_EVANGELIST,
        Rank.VENERABLE_SUPERIOR_EVANGELIST,
        Rank.SUPERIOR_EVANGELIST,
        Rank.CAPE_ELDER_BROTHER,
        Rank.BROTHER,
        Rank.ASSISTANT_EVANGELIST,
    ],
    [Gender.FEMALE]: [
        Rank.MOTHER_CELESTIAL,
        Rank.CAPE_ELDER_SISTER,
        Rank.SISTER,
    ],
};