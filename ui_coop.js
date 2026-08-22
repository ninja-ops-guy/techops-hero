// v7.53 Co-op asset authority fix: expose the assembled source on window so
// runtime renderers and QA asset-authority checks resolve the same canonical asset.
window.TO_UI_COOP = "data:image/webp;base64," + UIC_B64_1 + UIC_B64_2 + UIC_B64_3 + UIC_B64_4 + UIC_B64_5 + UIC_B64_6 + UIC_B64_7 + UIC_B64_8 + UIC_B64_9 + UIC_B64_10 + UIC_B64_11 + UIC_B64_12 + UIC_B64_13 + UIC_B64_14 + UIC_B64_15;
window.UI_COOP_ATLAS = { cols: 6, rows: 6, cell: [104, 104],
  frames: { host:[0,0], join:[1,0], add_player:[2,0], lobby_public:[3,0], lobby_locked:[4,0], lobby_locked_full:[5,0],
    slot_empty:[0,1], p1_ready:[1,1], p2_away:[2,1], p3_kick:[3,1], p4_anon:[4,1], slot_add:[5,1],
    mic_on:[0,2], mic_off:[1,2], voice_chat:[2,2], ping_good:[3,2], ping_mid:[4,2], ping_bad:[5,2],
    pad_gamepad:[0,3], pad_keyboard:[1,3], pad_touch:[2,3], crossplay:[3,3], cloud_sync:[4,3], region_globe:[5,3],
    ready:[0,4], cancel:[1,4], countdown_10:[2,4], refresh:[3,4], home:[4,4], logout:[5,4],
    avatar_k:[0,5], avatar_waldo:[1,5], avatar_mike:[2,5], avatar_duo:[3,5], net_heartbeat:[4,5], alert:[5,5] } };
