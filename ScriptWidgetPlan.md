# Script Widget Implementation Plan (30 Steps)

1. Define Script Widget requirements and user stories.
	 - Requirements
		 - Scripts can render text, numbers, and basic shapes in a widget area.
		 - Scripts can read a curated set of data sources (time, date, device, weather, user inputs).
		 - Script execution is deterministic and time-bounded.
		 - Scripts cannot access network, filesystem, or native APIs directly.
		 - Errors are surfaced in-editor with line/column and runtime message.
		 - Scripts can be saved, exported, and shared with a widget.
		 - Script output refresh interval is configurable per widget.
	 - User stories
		 - As a creator, I can write a script that outputs a formatted string to display.
		 - As a creator, I can preview script output live in the editor.
		 - As a creator, I can see clear error messages when my script fails.
		 - As a creator, I can reuse a script across multiple widgets.
		 - As a user, I can install a widget that updates on a schedule without opening the app.
2. Decide supported script language(s) and execution model.
	- Language: JavaScript (ES2020 subset) only, to align with app stack and avoid extra runtimes.
	- Execution model: in-app sandboxed interpreter, no eval of arbitrary native modules.
	- Entry point: script must export a single function `render(context)`.
	- Output contract: `render` returns a JSON-serializable object describing UI.
	- Time budget: hard timeout per run (e.g., 50ms) with cancellation.
	- Scheduling: on-demand in editor, periodic refresh in widget runtime.
3. Identify security boundaries and sandboxing constraints.
	- No access to `global`, `window`, `document`, or React Native native modules.
	- Whitelist-only API surface exposed via `context` object.
	- No network, file IO, or device identifiers.
	- Max script size (e.g., 50KB) and max output size (e.g., 200KB JSON).
	- Deterministic time source provided (`context.now`) to avoid side effects.
	- Sandboxed runtime must isolate memory per widget instance.
4. Draft data model for Script Widget settings and metadata.
	 - ScriptWidgetConfig
		 - id: string
		 - name: string
		 - script: string
		 - enabled: boolean
		 - refreshIntervalSec: number
		 - lastRunAt?: number
		 - lastError?: { message: string; line?: number; column?: number }
		 - outputCache?: object
	 - ScriptWidgetElement
		 - elementId: string
		 - configId: string
		 - outputBinding: string (path into output JSON)
5. Add Script Widget type to widget template types/enums.
	- Extend `WidgetComponent` union with `ScriptWidgetComponent`.
	- Add `scriptWidget` to `WidgetType` and any template size maps.
	- Update template category metadata to include Script Widgets.
6. Extend Canvas element types for script-backed content.
	- Add `scriptWidget` to `ElementType`.
	- Define `scriptConfigId` on `CanvasElement` for linkage.
	- Add optional `scriptOutput` cache on element for preview.
7. Define script execution API shape and expected inputs/outputs.
	 - Input `context` includes:
		 - now: number (epoch ms)
		 - locale: string
		 - timezone: string
		 - data: { time, date, weather, device, user }
		 - params: widget-level parameters
	 - Output `render` returns:
		 - { type: 'text', value: string, style?: TextStyle }
		 - { type: 'list', items: Array<{ value: string }> }
		 - { type: 'shape', shape: 'rect'|'circle', style?: ShapeStyle }
8. Specify script output rendering targets (text, image, data).
	- Text: single-line and multi-line text blocks.
	- Data: key/value list for quick stats display.
	- Shapes: basic rect/circle with color and opacity.
	- Images: optional future support (placeholder only for now).
9. Design UI for adding a Script Widget to canvas.
	- Add a new tool button in the editor sidebar: "Script".
	- Provide a quick-add dialog with template choices (blank, example).
	- Default size: medium widget block with centered placeholder text.
10. Design Script Widget editor panel layout and controls.
	- Left: script list/select with name + last run status.
	- Center: code editor with run/stop/format buttons.
	- Right: output preview (text/shape) and errors panel.
	- Bottom: refresh interval, params, and output bindings.
11. Add Script Widget placeholder template for testing.
	- Create a template named "Script Starter" with a script-backed element.
	- Include an example script returning a text output.
	- Tag it under a new "Script" category for discovery.
12. Implement script storage and serialization in widget data.
	- Extend widget save payload to include `scriptConfigs`.
	- Persist scripts in WidgetStorage alongside elements.
	- Include versioning for script config schema.
13. Implement script import/export in widget save/load flows.
	- Include scripts in export bundle (JSON or .widget package).
	- Validate schema on import and show warnings for invalid scripts.
	- Migrate older script configs when loading legacy widgets.
14. Add validation rules for script size and allowed APIs.
	- Reject scripts exceeding max size or forbidden identifiers.
	- Enforce output schema and size limits.
	- Validate refresh interval bounds.
15. Implement script editor component with syntax highlighting.
	- Use a lightweight JS editor component (e.g., Monaco/CodeMirror alternative for RN).
	- Provide syntax highlighting, line numbers, and error markers.
	- Support copy/paste and auto-indent.
16. Add script editor actions (run, format, reset).
	- Run: executes script in sandbox and updates preview.
	- Format: applies a safe formatter (basic JS formatting).
	- Reset: restores last saved script version.
17. Implement script execution service interface.
	- Define `ScriptRuntime` interface: `run(script, context) => result`.
	- Provide `compile` and `validate` helpers.
	- Return structured errors with line/column info.
18. Implement a safe script runtime (sandboxed execution).
	- Use a JS interpreter or restricted VM (no global access).
	- Disable dynamic imports and timers inside scripts.
	- Enforce CPU time and memory caps per execution.
19. Add runtime error capture and reporting UI.
	- Show inline error banner in editor with line/column.
	- Provide expandable stack trace/details.
	- Keep last successful output visible when errors occur.
20. Implement preview rendering for script outputs on canvas.
	- Map script output schema to existing renderers (text/list/shape).
	- Render placeholder when output is empty.
	- Respect widget sizing and alignment constraints.
21. Add data binding support from script outputs to elements.
	- Allow binding paths like `output.stats.steps` to text elements.
	- Add UI to select output keys for bindings.
	- Update bindings when script output changes.
22. Implement refresh scheduling for script outputs.
	- Editor: run on manual action and optionally on interval.
	- Runtime: run on widget refresh ticks and app resume.
	- Respect min/max interval bounds and battery limits.
23. Add caching strategy for script results.
	- Cache last successful output per script config.
	- Invalidate cache on script change or parameter update.
	- Persist cache only if size remains under limit.
24. Implement permissions prompts (if needed by scripts).
	- Enumerate data sources requiring user consent.
	- Show permission request UI before enabling scripts.
	- Store user consent per widget and data source.
25. Add unit tests for script parsing and execution.
	- Validate parser rejects forbidden tokens.
	- Validate runtime returns expected outputs for sample scripts.
	- Validate error reporting includes line/column.
26. Add integration tests for widget save/load with scripts.
	- Save a widget with script config and reload it.
	- Validate bindings restore correctly.
	- Validate script output cache handling across sessions.
27. Add UI tests for script editor and preview flows.
	- Verify code editor input and run action updates preview.
	- Verify errors appear and can be dismissed.
	- Verify bindings selection and applied output.
28. Document Script Widget usage in in-app help or docs.
	- Add a short guide with examples and limitations.
	- Include a template script and output schema reference.
29. Add analytics/telemetry events for script usage (optional).
	- Track script run count, errors, and performance.
	- Track adoption of Script Widgets vs other widget types.
30. Run full regression on editor, templates, and export flows.
	- Verify editor performance and stability with scripts enabled.
	- Verify templates list and preview render correctly.
	- Verify export/import round-trip with scripts.
