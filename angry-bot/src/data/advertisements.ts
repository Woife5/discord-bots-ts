import { getRandomInt } from "@woife5/shared";

export function getRandomAdvertisement() {
    return advertisements[getRandomInt(0, advertisements.length - 1)];
}

const advertisements = [
    "Brought to you by Malboromas!",
    "This fresh experience was brought to you by Malboromas.",
    "Savor the flavor - Malboromas",
    "Ignite your passion with a fresh Malboromas® cigarette.",
    "Ignite the flavor with 'Simply Red' by Malboromas!",
    "Live unfiltered, powered by Malboromas.",
    "Malboromas Red Soft - for the softie in you",
    "Taste the adventure, choose Malboromas Smooth.",
    "Malboromas Classics - Timeless Satisfaction.",
    "Experience the thrill, light up with Malboromas Silver.",
    "Malboromas: Where Every Puff is a Piece of Paradise!",
    "Puff the Stress Away - Malboromas, Your Ticket to Cloud Seven!",
    "Join the Malboromas Club - Where Flavor Meets Freedom!",
    "Malboromas: Because Real Men Don't Fear Smoke.",
    "Elevating the Skies, Defending the Future - Lockheed Matzi.",
    "Defending with Precision, Leading with Vision - Lockheed Matzi.",
    "Precision in Every Detail, Progress in Every Flight - Lockheed Matzi.",
    "Advancing Frontiers, Defending Horizons - Lockheed Matzi's Legacy.",
    "Redefining World Peace, the Lockheed Matzi Way.",
    "Lockheed Matzi: Building peace, one missile at a time.",
    "Lockheed Matzi: Turning Fiction into Lethal Reality.",
    "Lockheed Matzi: Because Why Negotiate When You Can Intimidate?",
    "Getting Peace Piece by Piece, One War at a Time - Lockheed Matzi.",
    "Rheinplastik: Shattering Boundaries, Engineering Brilliance.",
    "Precision in Motion, Progress in Every Innovation - Rheinplastik.",
    "Crafting the Future, Securing the Present - Rheinplastik.",
    "Piece by Piece, Engineering Peace - Rheinplastik",
    "Carbon Footprints Are Bigger with BP - Step Boldly!",
    "BePee: Because Mother Nature Needed a Makeover.",
    "BePee: Making Oceans More Interesting, One Barrel at a Time.",
    "BePee: Because Every Disaster is an Opportunity.",
    "Bringing the Art of Oil Spills to the Ocean's Canvas - Only by BePee.",
];
