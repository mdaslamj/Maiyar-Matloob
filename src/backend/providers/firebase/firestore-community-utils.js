import { RESPONSE_BUCKETS } from "../../../trend/trend-community-config.js";

export function bucketKeyForValue(value) {

    const match = RESPONSE_BUCKETS.find(bucket => bucket.value === Number(value));

    return match?.key || null;

}

export const FirestoreCommunityUtils = {
    bucketKeyForValue
};
