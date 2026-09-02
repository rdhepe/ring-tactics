import type { Character } from "../../types"
import mainPortrait     from "../../assets/wrestlers/big-crusher/big-crusher-main-portrait.jpg"
import haymakerImg      from "../../assets/wrestlers/big-crusher/big-crusher-haymaker.jpg"
import powerbombImg     from "../../assets/wrestlers/big-crusher/big-crusher-powerbomb.jpg"
import ironConstitution from "../../assets/wrestlers/big-crusher/big-crusher-iron-constitution.jpg"
import ropeADopeImg     from "../../assets/wrestlers/big-crusher/big-crusher-rope-a-dope.jpg"

export const crusher: Character = {
  id: "crusher",
  name: "Big Crusher",
  title: "The Iron Fist",
  description: "Old-school powerhouse who fights dirty and hits harder every round. Once he locks on, you tap or snap.",
  avatarUrl: mainPortrait,
  avatarColor: "bg-red-700",
  rarity: "common",
  classes: ["brawler", "tank"],
  maxHp: 100,
  skills: [
    {
      id: "crusher_s1",
      name: "Haymaker",
      description: "Winds up and delivers a skull-rattling punch. Deals 20 damage. Hit the same enemy next turn to combo for +5, +10, +15\u2026 more — miss a turn and it resets.",
      iconColor: "bg-red-600",
      iconUrl: haymakerImg,
      cost: { strength: 1 },
      cooldown: 0,
      targetType: "enemy",
      mainClass: "physical",
      persistence: "instant",
      effects: [{ type: "damage", value: 20, duration: 1 },
               { type: "damage_mark", value: 5, duration: 1, target: "enemy" }],
    },
    {
      id: "crusher_s2",
      name: "Powerbomb",
      description: "Hoists the opponent overhead and drives them skull-first into the mat for 35 piercing damage. No defence stops this.",
      iconColor: "bg-orange-700",
      iconUrl: powerbombImg,
      cost: { strength: 2 },
      cooldown: 1,
      targetType: "enemy",
      mainClass: "physical",
      persistence: "instant",
      effects: [{ type: "pierce_damage", value: 35, duration: 1 }],
    },
    {
      id: "crusher_s3",
      name: "Iron Constitution",
      description: "Shrugs off punishment for 2 rounds: reduces incoming damage by 15 and gains 20 destructible defence. Costs any energy type.",
      iconColor: "bg-gray-600",
      iconUrl: ironConstitution,
      cost: { strength: 1, random: 1 },
      cooldown: 3,
      targetType: "self",
      mainClass: "strategic",
      persistence: "instant",
      effects: [
        { type: "damage_reduction",     value: 15, duration: 2, target: "self" },
        { type: "destructible_defense", value: 20, duration: 2, target: "self" },
      ],
    },
    {
      id: "crusher_s4",
      name: "Rope-a-Dope",
      description: "Grabs the ropes and ducks behind the ref. Becomes invulnerable for 1 round. Costs any energy type.",
      iconColor: "bg-slate-600",
      iconUrl: ropeADopeImg,
      cost: { random: 1 },
      cooldown: 4,
      targetType: "self",
      mainClass: "strategic",
      persistence: "instant",
      effects: [{ type: "invulnerable", value: 1, duration: 1, target: "self" }],
    },
  ],
}
