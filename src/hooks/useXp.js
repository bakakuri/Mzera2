import { useState, useEffect } from "react";
import { xpApi, questsApi, hasSupabase, levelInfo } from "../ui/core";

// XP/level + daily-quest gamification state.
export function useXp({ tab, flash, dbErr }) {
  const [xp, setXp] = useState(120);
  const [questData, setQuestData] = useState(null);

  const gainXp = (n) => {
    setXp(x => {
      const nx = x + n;
      const newLvl = levelInfo(nx).lvl;
      if (newLvl > levelInfo(x).lvl && hasSupabase) xpApi.notifyLevelUp(newLvl).catch(() => {});
      return nx;
    });
    if (hasSupabase) xpApi.add(n).catch(() => {});
  };
  const loadQuests = () => { if (!hasSupabase) return; questsApi.today().then(setQuestData).catch(() => {}); };
  useEffect(() => { if (tab === "progress") loadQuests(); }, [tab]);

  const onClaimQuest = (quest, amount) => {
    questsApi.claim(quest, amount).then(ok => {
      if (ok) {
        setXp(x => {
          const nx = x + amount;
          const newLvl = levelInfo(nx).lvl;
          if (newLvl > levelInfo(x).lvl && hasSupabase) xpApi.notifyLevelUp(newLvl).catch(() => {});
          return nx;
        });
        setQuestData(q => q ? { ...q, claimed: [...q.claimed, quest] } : q); flash(`+${amount} XP 🎉`);
      }
      else setQuestData(q => q ? { ...q, claimed: q.claimed.includes(quest) ? q.claimed : [...q.claimed, quest] } : q);
    }).catch(dbErr("ჯილდო"));
  };

  return { xp, setXp, gainXp, questData, onClaimQuest };
}
