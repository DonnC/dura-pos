// Copyright (c) 2026, DonnC & contributors.
// Please see the AUTHORS file for details. All rights reserved.
// Use of this source code is governed by the MIT license that can be
// found in the LICENSE file at the repository root.
// SPDX-License-Identifier: MIT

/// Shared Dura POS theme and presentation components.
///
/// Every component wraps a standard Flutter widget and takes its look from
/// [DuraTokens], read with `context.dura`. Screens use these, not Material's
/// widgets directly, so the whole app stays uniform and a component can change
/// underneath without touching a screen.
library;

export 'src/components/dura_action_dock.dart';
export 'src/components/dura_amount_field.dart';
export 'src/components/dura_amount_size.dart';
export 'src/components/dura_amount_text.dart';
export 'src/components/dura_button.dart';
export 'src/components/dura_button_variant.dart';
export 'src/components/dura_chip.dart';
export 'src/components/dura_field_decoration.dart';
export 'src/components/dura_labelled.dart';
export 'src/components/dura_list_row.dart';
export 'src/components/dura_nav_bar.dart';
export 'src/components/dura_nav_button.dart';
export 'src/components/dura_nav_item.dart';
export 'src/components/dura_nav_rail.dart';
export 'src/components/dura_notice.dart';
export 'src/components/dura_notice_tone.dart';
export 'src/components/dura_page_heading.dart';
export 'src/components/dura_shop_header.dart';
export 'src/components/dura_summary_card.dart';
export 'src/components/dura_text_field.dart';
export 'src/components/dura_toggle_row.dart';
export 'src/dialogs/show_dura_confirmation.dart';
export 'src/layout/dura_page.dart';
export 'src/layout/dura_window.dart';
export 'src/theme/dura_colors.dart';
export 'src/theme/dura_context.dart';
export 'src/theme/dura_palette.dart';
export 'src/theme/dura_radii.dart';
export 'src/theme/dura_sizes.dart';
export 'src/theme/dura_space.dart';
export 'src/theme/dura_theme.dart';
export 'src/theme/dura_tokens.dart';
export 'src/theme/dura_type.dart';
