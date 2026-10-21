// A sample sermon created once on a database that has never had one, so the
// sermon pages can be reviewed before real sermons are added. Delete it from
// the admin panel (Sermons Manager) when it is no longer needed; it is never
// recreated, because db.js records that it was seeded.
//
// The image is a static file in the frontend's public folder.

export const PLACEHOLDER_SERMON = {
    title: "Sample Sermon: All Things Are Possible",
    speaker: "Placeholder Speaker",
    speakerImageUrl: "/placeholder-speaker.svg",
    body: `This is a placeholder sermon. It shows how a sermon is laid out on the website. Delete it from the admin panel once you have added your own.

## Faith that sees beyond the present

> Jesus said unto him, If thou canst believe, all things are possible to him that believeth. (Mark 9:23)

A father brought his son to Jesus after every other hope had failed. His prayer was honest: "Lord, I believe; help thou mine unbelief." Faith does not begin with certainty. It begins with bringing what we have to the One who is able.

## Possibility is a Person

The word "possible" in this passage is not a promise that every wish will be granted. It points to the power of God at work in the life of the believer. Our possibilities are found in Him.

When we gather as a church family, we come expecting God to move: in healing, in provision, in restoration and in salvation.

## A word for this week

Take one situation you have stopped praying about and bring it back to God this week. Write it down, pray over it daily, and share it with someone who will stand in faith with you.

May the God of all possibility meet you at the point of your need.`,
};
