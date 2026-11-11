#!/usr/bin/env node
"use strict";
const { spawnSync } = require("child_process");
const fs = require("fs");

const tests = [
  "test_day_dialogue_variance.js",
  "test_campaign_day_spatial_music.js",
  "test_runtime_day_cases.js",
  "test_runtime_day_world.js",
  "test_runtime_day_audio.js",
  "test_runtime_day_experience.js",
  "test_day_interaction_accessibility.js",
