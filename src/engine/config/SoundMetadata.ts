import { AUDIO_CONFIG } from './AudioConfig';

export type SoundCategory = 'UI' | 'COMBAT' | 'AMBIENCE' | 'UNUSED';

export interface SoundMeta {
  key: string;
  label: string;
  description: string;
  category: SoundCategory;
  usage: string;
}

export const SOUND_METADATA: Record<string, SoundMeta> = {
  'ui_click': { key: 'ui_click', label: 'Click', description: 'Standard interaction', category: 'UI', usage: 'Buttons, Toggles' },
  'ui_hover': { key: 'ui_hover', label: 'Hover', description: 'High frequency blip', category: 'UI', usage: 'Pointer over interactive elements' },
  'ui_menu_open': { key: 'ui_menu_open', label: 'Menu Open', description: 'Ascending slide', category: 'UI', usage: 'Modal/Debug open' },
  'ui_menu_close': { key: 'ui_menu_close', label: 'Menu Close', description: 'Descending slide', category: 'UI', usage: 'Modal/Debug close' },
  'ui_optimal': { key: 'ui_optimal', label: 'Optimal', description: 'Positive chime', category: 'UI', usage: 'Settings: High Quality, Health Full' },
  'ui_error': { key: 'ui_error', label: 'Error', description: 'Negative buzz', category: 'UI', usage: 'Settings: Potato, Mobile Rejection' },
  'ui_chirp': { key: 'ui_chirp', label: 'Chirp', description: 'Data process sound', category: 'UI', usage: 'Mobile Scan Step' },

  'fx_player_fire': { key: 'fx_player_fire', label: 'Plasma Shot', description: 'Player primary fire', category: 'COMBAT', usage: 'PlayerSystem: Auto-fire' },
  'fx_enemy_fire': { key: 'fx_enemy_fire', label: 'Enemy Shot', description: 'Enemy return fire', category: 'COMBAT', usage: 'Unused (Enemies currently silent on fire)' },
  'fx_impact_light': { key: 'fx_impact_light', label: 'Light Hit', description: 'Small explosion', category: 'COMBAT', usage: 'Enemy death (Small), Mobile Tap Kill' },
  'fx_impact_heavy': { key: 'fx_impact_heavy', label: 'Heavy Hit', description: 'Large explosion', category: 'COMBAT', usage: 'Player Hit, Panel Destroyed, Kamikaze Death' },
  'fx_boot_sequence': { key: 'fx_boot_sequence', label: 'Boot Up', description: 'Heavy startup thrum', category: 'AMBIENCE', usage: 'Intro Sequence Start' },
  'fx_player_death': { key: 'fx_player_death', label: 'Flatline', description: 'System failure noise', category: 'COMBAT', usage: 'GameState: Player Health <= 0' },
  'fx_level_up': { key: 'fx_level_up', label: 'Level Up', description: 'Ascending chord', category: 'COMBAT', usage: 'Upgrade Menu Open' },
  'fx_reboot_success': { key: 'fx_reboot_success', label: 'Reboot', description: 'System restore chime', category: 'COMBAT', usage: 'Player/Panel Revival' },
  'fx_teleport': { key: 'fx_teleport', label: 'Teleport', description: 'Phase shift', category: 'COMBAT', usage: 'Unused' },
  
  'fx_exhaust_sizzle': { key: 'fx_exhaust_sizzle', label: 'Sizzle', description: 'Burning fuse', category: 'COMBAT', usage: 'Hunter: Exhaust trail' },

  'loop_heal': { key: 'loop_heal', label: 'Repair Loop', description: 'Healing hum', category: 'AMBIENCE', usage: 'InteractionSystem: Healing Panel' },
  'loop_reboot': { key: 'loop_reboot', label: 'Reboot Loop', description: 'Power build-up', category: 'AMBIENCE', usage: 'InteractionSystem: Rebooting Panel' },
  'loop_warning': { key: 'loop_warning', label: 'Low Health', description: 'Heartbeat alarm', category: 'AMBIENCE', usage: 'GameState: Health < 30%' },
  'loop_drill': { key: 'loop_drill', label: 'Drill Grind', description: 'Mechanical grinding', category: 'COMBAT', usage: 'DrillerLogic: Contact with Panel' },
  'ambience_core': { key: 'ambience_core', label: 'Core Hum', description: 'Background Brown Noise', category: 'AMBIENCE', usage: 'Global Background Track' },

  'syn_fm_scream': { key: 'syn_fm_scream', label: 'FM Scream', description: 'Aggressive mod', category: 'UNUSED', usage: 'Prototype' },
  'syn_data_burst': { key: 'syn_data_burst', label: 'Data Burst', description: 'Square wave packet', category: 'UNUSED', usage: 'Prototype' },
  'syn_bass_drop': { key: 'syn_bass_drop', label: 'Bass Drop', description: 'Sub frequency dive', category: 'UNUSED', usage: 'Prototype' },
  'syn_alarm_chirp': { key: 'syn_alarm_chirp', label: 'Alarm Chirp', description: 'High pitch alert', category: 'UNUSED', usage: 'Prototype' },
  'syn_static_burst': { key: 'syn_static_burst', label: 'Static', description: 'White noise burst', category: 'UNUSED', usage: 'Prototype' },
  'syn_wobble_bass': { key: 'syn_wobble_bass', label: 'Wobble', description: 'LFO Bass', category: 'UNUSED', usage: 'Prototype' },
  'syn_grind_loop': { key: 'syn_grind_loop', label: 'Grind Loop', description: 'Industrial texture', category: 'UNUSED', usage: 'Prototype' },
  'syn_insect_swarm': { key: 'syn_insect_swarm', label: 'Swarm', description: 'High freq jitter', category: 'UNUSED', usage: 'Prototype' },
  'syn_interference': { key: 'syn_interference', label: 'Interference', description: 'Radio static', category: 'UNUSED', usage: 'Prototype' },
  'syn_wind_howl': { key: 'syn_wind_howl', label: 'Wind', description: 'Filtered noise', category: 'UNUSED', usage: 'Prototype' },
  'syn_robot_chatter': { key: 'syn_robot_chatter', label: 'Bot Chatter', description: 'S&H Randomness', category: 'UNUSED', usage: 'Prototype' },
  'syn_deep_hum': { key: 'syn_deep_hum', label: 'Deep Hum', description: 'Low rumble', category: 'UNUSED', usage: 'Prototype' },
  'syn_sine_rise': { key: 'syn_sine_rise', label: 'Sine Rise', description: 'Pitch up', category: 'UNUSED', usage: 'Prototype' },
  'syn_saw_rise': { key: 'syn_saw_rise', label: 'Saw Rise', description: 'Aggressive pitch up', category: 'UNUSED', usage: 'Prototype' },
  'syn_sqr_rise': { key: 'syn_sqr_rise', label: 'Square Rise', description: '8-bit pitch up', category: 'UNUSED', usage: 'Prototype' },
  'syn_siren_wail': { key: 'syn_siren_wail', label: 'Siren', description: 'Slow LFO', category: 'UNUSED', usage: 'Prototype' },
  'syn_alert_pulse': { key: 'syn_alert_pulse', label: 'Alert Pulse', description: 'Fast LFO', category: 'UNUSED', usage: 'Prototype' },
  'syn_static_wash': { key: 'syn_static_wash', label: 'Wash', description: 'Ocean-like noise', category: 'UNUSED', usage: 'Prototype' },
};

export const getUnlistedSounds = () => {
    const configKeys = Object.keys(AUDIO_CONFIG);
    const metaKeys = Object.keys(SOUND_METADATA);
    return configKeys.filter(k => !metaKeys.includes(k));
};
