import { angryEmojis } from "./angry-emojis";

export interface CustomReaction {
    [key: string]: {
        reactions: string[];
        angrys: number;
    };
}

export const customReactions: CustomReaction = {
    "267281854690754561": {
        reactions: [
            "<:angry1:824231077588762634>",
            "🇼",
            "<:angry55:840157840677273611>",
            "🇱",
            "🇫",
            "🇮",
            "<:angry2:824231091556188170>",
        ],
        angrys: 3,
    },
    "138678366730452992": {
        reactions: ["<:angry1:824231077588762634>", "🇫", "🇪", "🇱", "🇮", "🇽", "<:angry2:824231091556188170>"],
        angrys: 2,
    },
    "297031236860510208": {
        reactions: ["<:angry1:824231077588762634>", "🇱", "🇺", "🇲", "🇮", "<:angry2:824231091556188170>"],
        angrys: 2,
    },
    "630465849270075402": {
        reactions: ["<:angry1:824231077588762634>", "🇱", "🇦", "🇺", "🇷", "🅰️", "<:angry2:824231091556188170>"],
        angrys: 2,
    },
    "638705859123216394": {
        reactions: ["<:angry1:824231077588762634>", "🇹", "🇴", "🇧", "🇮", "<:angry2:824231091556188170>"],
        angrys: 2,
    },
    "214725217967144960": {
        reactions: ["<:angry1:824231077588762634>", "🌻", "👑", "<:angry2:824231091556188170>"],
        angrys: 2,
    },
    "656443344486006795": {
        reactions: ["<:angry1:824231077588762634>", "🍪", "<:angry2:824231091556188170>"],
        angrys: 2,
    },
    "351375977303244800": {
        reactions: [
            "🦑",
            "<:angry1:824231077588762634>",
            "<:angry2:824231091556188170>",
            "<:angry3:824231102725488640>",
        ],
        angrys: 3,
    },
    "687931148419989510": {
        reactions: ["❤", "🧡", "💛", "💚", "💙", "💜", "🤎", "🖤", "🤍"],
        angrys: 0,
    },
    "775641005830438962": {
        reactions: [
            "<:angry1:824231077588762634>",
            ":regional_indicator_c:",
            ":regional_indicator_h:",
            "🇮",
            ":black_cat:",
            "🇷",
            "🇦",
            "<:angry3:824231102725488640>",
        ],
        angrys: 2,
    },
    "676092929978269718": {
        reactions: [
            angryEmojis[0],
            "smiling_imp",
            "shark",
            "dumpling",
            "new_moon_with_face",
            angryEmojis[1],
        ],
        angrys: 2,
    },
    "300673115791294474": {
        reactions: [
            angryEmojis[0],
            "regional_indicator_m",
            "face_holding_back_tears",
            "regional_indicator_t",
            "regional_indicator_z",
            "regional_indicator_i",
            angryEmojis[8],
        ],
        angrys: 2,
    },
};
