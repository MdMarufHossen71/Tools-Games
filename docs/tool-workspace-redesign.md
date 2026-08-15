# Mobile-First Tool Workspace Redesign

## Issue Addressed

The earlier shared workspace exposed an unlabelled native file control alongside an irrelevant text area for image, PDF, media, and other file-based tools. On a phone this made the input path unclear and could suggest that an image was expected to be pasted as text.

## Delivered Interaction Model

The shared `ToolPage` now selects its input surface by category rather than showing one generic form:

| Tool family | Input model | Visitor guidance | Output state |
|---|---|---|---|
| Text, web, crypto, number, and email utilities | Private local text workspace with an optional relevant example | Enter or paste content, run the tool, then copy or download the result | Empty until an explicit run/generate action |
| Image, PDF, media, and file utilities | Large labelled device picker/drop zone with accepted file type and selected-file confirmation | Choose from the phone/computer; mobile browsers then expose their native gallery, camera, files, or cloud-provider choices where supported by the device | Empty until the visitor explicitly runs the tool |
| Concrete image transformations | Same upload surface plus an explicit Resize, Rotate, or Flip control | Upload an image, choose the adjustment, run, preview, and download a PNG | Browser-local processed image preview and download |
| Guided file workspaces without a local transformer | Same device picker and an accurate “not enabled yet” disclosure | Acknowledges the selected file without claiming to perform an unavailable transformation | No false processed output or upload claim |

The workspace now also applies an explicit category model to all twelve catalogue families. Images, PDF, media, and general-file tools use type-restricted device pickers; math, number, and date tools request a numeric phone keyboard; web/developer and cryptography tools use the data-entry model; and text, creative, and color tools use the text-entry model. The model is covered by a regression test that enumerates every category, rather than relying on an implicit fallback.

## Concrete Image Processing at Launch

**Image Resize**, **Image Rotate**, **Image Flip**, **Image Converter**, and **Image Compressor** now process selected images in the visitor’s browser with Canvas and offer an image preview plus download. Converter output format is explicit, while Compressor exposes a bounded JPEG-quality control; neither sends the source image to ToolsHUB. The interface deliberately keeps the action disabled until an image is selected. It also avoids exposing an image data URL while the result is being prepared.

## Mobile and Desktop Verification

Phone verification at 375×812 confirmed the labelled chooser, type-specific controls, touch-sized action, empty pre-action output, and Bengali labels for Image Resize, Image Rotate, Image Flip, File to Text, File to Base64, and File Size Converter. Desktop verification at 1280×720 covered Image Resize, JSON Formatter, PDF Metadata, and Random Number. A valid `pdf-metadata` route replaced an earlier invalid route used during the audit; File to Text is now a real visible route with a browser-local text-reading processor. Additional phone verification confirmed that Image Converter presents its explicit PNG output selector in বাংলা and Image Compressor presents its JPEG-quality slider in Arabic RTL. Both retain the labelled native image chooser, local-processing notice, disabled pre-action state, and download controls.

The translation coverage suite verifies the shared workspace vocabulary in all eight locale dictionaries at 100% key coverage. Phone review also covered Arabic and Urdu RTL layouts, confirming that the file chooser, action row, output controls, and category guidance remain readable and reachable in both directions.

The automated workspace rendering suite covers a non-Bangla LTR locale and Arabic. It asserts localized pre-action output, run-action copy, file-picker labels, implemented processor status, the Arabic `dir="rtl"` workspace state, PDF and media accept types, the generic `*/*` file-utility contract, and numeric versus text entry models for calculator and developer tools.

The final 1280×720 and 375×812 visual review covered Bengali Image Resize, Arabic PDF Metadata, Urdu File to Base64, and Spanish Calculator. The image tool showed the native image chooser, resize percentage control, and no misleading text input. The Arabic and Urdu file workspaces preserved RTL control order, displayed clear accepted-file guidance, and kept their results empty before an action. The Spanish numeric workspace retained a concise text-entry and action flow without file-specific controls. No overlapping controls, clipped action buttons, or pre-action result values were observed in these representative category journeys.

## Follow-Up Boundary

This redesign corrects the common interaction and messaging problem across the catalogue. It does not falsely represent every catalogue listing as a finished file transformer. Additional concrete image, PDF, media, and file processors should be added incrementally, with their own local-processing tests and clear capability notices.
