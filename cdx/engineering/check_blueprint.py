"""Validate the staged engineering blueprint; does not test a Flutter app.

Requires PyYAML. A local validation-only installation can be placed in
cdx/.validation-deps and added to PYTHONPATH without changing app dependencies.
"""
from pathlib import Path
import json
import re
import sys

import yaml


def require(condition, message):
    if not condition:
        raise ValueError(message)


def main():
    cdx = Path(__file__).resolve().parents[1]
    scaffold = cdx / "scaffold"
    workflow = yaml.load(
        (scaffold / ".github/workflows/main.yml.template").read_text(encoding="utf-8"),
        Loader=yaml.BaseLoader,
    )
    require(workflow["on"] == {"push": {"branches": ["main"]}},
            "Workflow must trigger only on push to main")
    require(workflow["permissions"] == {"contents": "read"},
            "Default workflow token must be read-only")
    require(set(workflow["jobs"]["release"]["needs"]) == {"verify", "android"},
            "Release must depend on verification and native integration")
    require(workflow["concurrency"]["cancel-in-progress"] == "false",
            "Do not cancel publication halfway through")
    release_steps = workflow["jobs"]["release"]["steps"]
    publish = next(s for s in release_steps if "publish_release.dart" in s.get("run", ""))
    require(publish.get("if") == "steps.intent.outputs.publish == 'true'",
            "Publication needs explicit validated intent")

    dependencies = yaml.safe_load(
        (scaffold / ".github/dependabot.yml.template").read_text(encoding="utf-8")
    )
    require({u["package-ecosystem"] for u in dependencies["updates"]} ==
            {"pub", "gradle", "github-actions"}, "Unexpected dependency ecosystem")
    for update in dependencies["updates"]:
        require(update["schedule"]["interval"] == "monthly", "Routine updates must be monthly")
        require(update["open-pull-requests-limit"] == 2, "Routine PR count must be bounded")
        types = {tuple(g["update-types"]) for g in update["groups"].values()}
        require(types == {("minor", "patch"), ("major",)}, "Separate major dependency review")

    manifest = json.loads((scaffold / "release.json.template").read_text(encoding="utf-8"))
    require(manifest["publish"] is False, "Staged release must be disabled")
    yaml_count = 0
    for file in scaffold.rglob("*"):
        if file.is_file() and (file.suffix in {".yml", ".yaml"} or
                               file.name.endswith((".yml.template", ".yaml.template"))):
            yaml.load(file.read_text(encoding="utf-8"), Loader=yaml.BaseLoader)
            yaml_count += 1

    checked_links = json_examples = 0
    for folder in (cdx / "engineering", cdx / "scaffold", cdx / "skills"):
        for file in folder.rglob("*.md"):
            text = file.read_text(encoding="utf-8")
            for example in re.findall(r"```json\s*\n(.*?)\n```", text, re.S):
                json.loads(example)
                json_examples += 1
            for link in re.findall(r"\]\(([^)]+)\)", text):
                if "://" in link or link.startswith("#"):
                    continue
                target = link.split("#", 1)[0]
                require((file.parent / target).exists(), f"Broken local link in {file}: {link}")
                checked_links += 1

    skills = list((cdx / "skills").glob("*/SKILL.md"))
    require(len(skills) == 5, "Expected five project skill sources")
    for file in skills:
        text = file.read_text(encoding="utf-8")
        front = re.match(r"^---\n(.*?)\n---", text, re.S)
        require(front is not None, f"Missing frontmatter: {file}")
        metadata = yaml.safe_load(front.group(1))
        require(metadata["name"] == file.parent.name, f"Skill folder/name mismatch: {file}")
        ui_file = file.parent / "agents/openai.yaml"
        require(ui_file.exists(), f"Missing UI metadata: {file}")
        ui = yaml.safe_load(ui_file.read_text(encoding="utf-8"))["interface"]
        require("$" + metadata["name"] in ui["default_prompt"], "Prompt must name its skill")
    require((cdx / "branding/dura-silo-phone-dollar-v3.png").exists(), "Missing revised logo")
    print(f"PASS: main-only release gates; monthly dependency groups; {yaml_count} YAML templates; "
          f"{json_examples} JSON previews; {checked_links} local links; five skill metadata files.")
    print("Blueprint checks only. No Flutter, native, workbook-recalculation or GitHub execution claimed.")


if __name__ == "__main__":
    try:
        main()
    except (ValueError, KeyError, StopIteration, json.JSONDecodeError, yaml.YAMLError) as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        raise SystemExit(1)
