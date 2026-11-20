// Captured syntax highlighting grammar; loaded only when a sample needs it.
export const highlightModules = [
  [
    [883808],
    (e) => {
      "use strict";
      let n = Object.freeze(
        JSON.parse(
          '{"displayName":"Shell","name":"shellscript","patterns":[{"include":"#initial_context"}],"repository":{"alias_statement":{"begin":"[\\\\t ]*+(alias)[\\\\t ]*+((?:((?<!\\\\w)-\\\\w+)\\\\b[\\\\t ]*+)*)[\\\\t ]*+((?<!\\\\w)[-0-9A-Z_a-z]+(?!\\\\w))(?:(\\\\[)((?:(?:\\\\$?(?<!\\\\w)[-0-9A-Z_a-z]+(?!\\\\w)|@)|\\\\*)|(-?\\\\d+))(]))?(?:(?:(=)|(\\\\+=))|(-=))","beginCaptures":{"1":{"name":"storage.type.alias.shell"},"2":{"patterns":[{"match":"(?<!\\\\w)-\\\\w+\\\\b","name":"string.unquoted.argument.shell constant.other.option.shell"}]},"3":{"name":"string.unquoted.argument.shell constant.other.option.shell"},"4":{"name":"variable.other.assignment.shell"},"5":{"name":"punctuation.definition.array.access.shell"},"6":{"name":"variable.other.assignment.shell"},"7":{"name":"constant.numeric.shell constant.numeric.integer.shell"},"8":{"name":"punctuation.definition.array.access.shell"},"9":{"name":"keyword.operator.assignment.shell"},"10":{"name":"keyword.operator.assignment.compound.shell"},"11":{"name":"keyword.operator.assignment.compound.shell"}},"end":"(?=[\\\\t ]|$)|(?:(?:(?:(;)|(&&))|(\\\\|\\\\|))|(&))","endCaptures":{"1":{"name":"punctuation.terminator.statement.semicolon.shell"},"2":{"name":"punctuation.separator.statement.and.shell"},"3":{"name":"punctuation.separator.statement.or.shell"},"4":{"name":"punctuation.separator.statement.background.shell"}},"name":"meta.expression.assignment.alias.shell","patterns":[{"include":"#normal_context"}]},"argument":{"begin":"[\\\\t ]++(?![\\\\n#\\\\&(\\\\[|]|$|;)","beginCaptures":{},"end":"(?=[\\\\t \\\\&;|]|$|[\\\\n)`])","endCaptures":{},"name":"meta.argument.shell","patterns":[{"include":"#argument_context"},{"include":"#line_continuation"}]},"argument_context":{"patterns":[{"captures":{"1":{"name":"string.unquoted.argument.shell","patterns":[{"match":"\\\\*","name":"variable.language.special.wildcard.shell"},{"include":"#variable"},{"include":"#numeric_literal"},{"captures":{"1":{"name":"constant.language.$1.shell"}},"match":"(?<!\\\\w)\\\\b(true|false)\\\\b(?!\\\\w)"}]}},"match":"[\\\\t ]*+([^\\\\t\\\\n \\"$\\\\&-);<>\\\\\\\\`|]+(?!>))"},{"include":"#normal_context"}]},"arithmetic_double":{"patterns":[{"begin":"\\\\(\\\\(","beginCaptures":{"0":{"name":"punctuation.section.arithmetic.double.shell"}},"end":"\\\\)\\\\s*\\\\)","endCaptures":{"0":{"name":"punctuation.section.arithmetic.double.shell"}},"name":"meta.arithmetic.shell","patterns":[{"include":"#math"},{"include":"#string"}]}]},"arithmetic_no_dollar":{"patterns":[{"begin":"\\\\(","beginCaptures":{"0":{"name":"punctuation.section.arithmetic.single.shell"}},"end":"\\\\)","endCaptures":{"0":{"name":"punctuation.section.arithmetic.single.shell"}},"name":"meta.arithmetic.shell","patterns":[{"include":"#math"},{"include":"#string"}]}]},"array_access_inline":{"captures":{"1":{"name":"punctuation.section.array.shell"},"2":{"patterns":[{"include":"#special_expansion"},{"include":"#string"},{"include":"#variable"}]},"3":{"name":"punctuation.section.array.shell"}},"match":"(\\\\[)([^]\\\\[]+)(])"},"array_value":{"begin":"[\\\\t ]*+((?<!\\\\w)[-0-9A-Z_a-z]+(?!\\\\w))(?:(\\\\[)((?:(?:\\\\$?(?<!\\\\w)[-0-9A-Z_a-z]+(?!\\\\w)|@)|\\\\*)|(-?\\\\d+))(]))?(?:(?:(=)|(\\\\+=))|(-=))[\\\\t ]*+(\\\\()","beginCaptures":{"1":{"name":"variable.other.assignment.shell"},"2":{"name":"punctuation.definition.array.access.shell"},"3":{"name":"variable.other.assignment.shell"},"4":{"name":"constant.numeric.shell constant.numeric.integer.shell"},"5":{"name":"punctuation.definition.array.access.shell"},"6":{"name":"keyword.operator.assignment.shell"},"7":{"name":"keyword.operator.assignment.compound.shell"},"8":{"name":"keyword.operator.assignment.compound.shell"},"9":{"name":"punctuation.definition.array.shell"}},"end":"\\\\)","endCaptures":{"0":{"name":"punctuation.definition.array.shell"}},"patterns":[{"include":"#comment"},{"captures":{"1":{"name":"variable.other.assignment.array.shell entity.other.attribute-name.shell"},"2":{"name":"keyword.operator.assignment.shell punctuation.definition.assignment.shell"}},"match":"((?<!\\\\w)[-0-9A-Z_a-z]+(?!\\\\w))(=)"},{"captures":{"1":{"name":"punctuation.definition.bracket.named-array.shell"},"2":{"name":"string.unquoted.shell entity.other.attribute-name.bracket.shell"},"3":{"name":"punctuation.definition.bracket.named-array.shell"},"4":{"name":"punctuation.definition.assignment.shell"}},"match":"(\\\\[)(.+?)(])(=)"},{"include":"#normal_context"},{"include":"#simple_unquoted"}]},"assignment_statement":{"patterns":[{"include":"#array_value"},{"include":"#modified_assignment_statement"},{"include":"#normal_assignment_statement"}]},"basic_command_name":{"captures":{"1":{"name":"storage.modifier.$1.shell"},"2":{"name":"entity.name.function.call.shell entity.name.command.shell","patterns":[{"match":"(?<!\\\\w)(?:continue|return|break)(?!\\\\w)","name":"keyword.control.$0.shell"},{"match":"(?<!\\\\w)(?:unfunction|continue|autoload|unsetopt|bindkey|builtin|getopts|command|declare|unalias|history|unlimit|typeset|suspend|source|printf|unhash|disown|ulimit|return|which|alias|break|false|print|shift|times|umask|unset|read|type|exec|eval|wait|echo|dirs|jobs|kill|hash|stat|exit|test|trap|true|let|set|pwd|cd|fg|bg|fc|[.:])(?!/)(?!\\\\w)(?!-)","name":"support.function.builtin.shell"},{"include":"#variable"}]}},"match":"(?![\\\\n!#\\\\&()<>\\\\[{|]|$|[\\\\t ;])(?!nocorrect |nocorrect\\\\t|nocorrect$|readonly |readonly\\\\t|readonly$|function |function\\\\t|function$|foreach |foreach\\\\t|foreach$|coproc |coproc\\\\t|coproc$|logout |logout\\\\t|logout$|export |export\\\\t|export$|select |select\\\\t|select$|repeat |repeat\\\\t|repeat$|pushd |pushd\\\\t|pushd$|until |until\\\\t|until$|while |while\\\\t|while$|local |local\\\\t|local$|case |case\\\\t|case$|done |done\\\\t|done$|elif |elif\\\\t|elif$|else |else\\\\t|else$|esac |esac\\\\t|esac$|popd |popd\\\\t|popd$|then |then\\\\t|then$|time |time\\\\t|time$|for |for\\\\t|for$|end |end\\\\t|end$|fi |fi\\\\t|fi$|do |do\\\\t|do$|in |in\\\\t|in$|if |if\\\\t|if$)(?:((?<=^|[\\\\t \\\\&;])(?:readonly|declare|typeset|export|local)(?=[\\\\t \\\\&;]|$))|((?![\\"\']|\\\\\\\\\\\\n?$)[^\\\\t\\\\n\\\\r !\\"\'<>]+?))(?:(?=[\\\\t ])|(?=[\\\\n\\\\&);`{|}]|[\\\\t ]*#|])(?<!\\\\\\\\))","name":"meta.statement.command.name.basic.shell"},"block_comment":{"begin":"\\\\s*+(/\\\\*)","beginCaptures":{"1":{"name":"punctuation.definition.comment.begin.shell"}},"end":"\\\\*/","endCaptures":{"0":{"name":"punctuation.definition.comment.end.shell"}},"name":"comment.block.shell"},"boolean":{"match":"\\\\b(?:true|false)\\\\b","name":"constant.language.$0.shell"},"case_statement":{"begin":"\\\\b(case)\\\\b[\\\\t ]*+(.+?)[\\\\t ]*+\\\\b(in)\\\\b","beginCaptures":{"1":{"name":"keyword.control.case.shell"},"2":{"patterns":[{"include":"#initial_context"}]},"3":{"name":"keyword.control.in.shell"}},"end":"\\\\besac\\\\b","endCaptures":{"0":{"name":"keyword.control.esac.shell"}},"name":"meta.case.shell","patterns":[{"include":"#comment"},{"captures":{"1":{"name":"keyword.operator.pattern.case.default.shell"}},"match":"[\\\\t ]*+(\\\\* *\\\\))"},{"begin":"(?<!\\\\))(?![\\\\t ]*+(?:esac\\\\b|$))","beginCaptures":{},"end":"(?=\\\\besac\\\\b)|(\\\\))","endCaptures":{"1":{"name":"keyword.operator.pattern.case.shell"}},"name":"meta.case.entry.pattern.shell","patterns":[{"include":"#case_statement_context"}]},{"begin":"(?<=\\\\))","beginCaptures":{},"end":"(;;)|(?=\\\\besac\\\\b)","endCaptures":{"1":{"name":"punctuation.terminator.statement.case.shell"}},"name":"meta.case.entry.body.shell","patterns":[{"include":"#typical_statements"},{"include":"#initial_context"}]}]},"case_statement_context":{"patterns":[{"match":"\\\\*","name":"variable.language.special.quantifier.star.shell keyword.operator.quantifier.star.shell punctuation.definition.arbitrary-repetition.shell punctuation.definition.regex.arbitrary-repetition.shell"},{"match":"\\\\+","name":"variable.language.special.quantifier.plus.shell keyword.operator.quantifier.plus.shell punctuation.definition.arbitrary-repetition.shell punctuation.definition.regex.arbitrary-repetition.shell"},{"match":"\\\\?","name":"variable.language.special.quantifier.question.shell keyword.operator.quantifier.question.shell punctuation.definition.arbitrary-repetition.shell punctuation.definition.regex.arbitrary-repetition.shell"},{"match":"@","name":"variable.language.special.at.shell keyword.operator.at.shell punctuation.definition.regex.at.shell"},{"match":"\\\\|","name":"keyword.operator.orvariable.language.special.or.shell keyword.operator.alternation.ruby.shell punctuation.definition.regex.alternation.shell punctuation.separator.regex.alternation.shell"},{"match":"\\\\\\\\.","name":"constant.character.escape.shell"},{"match":"(?<=\\\\tin| in|[\\\\t ]|;;)\\\\(","name":"keyword.operator.pattern.case.shell"},{"begin":"(?<=\\\\S)(\\\\()","beginCaptures":{"1":{"name":"punctuation.definition.group.shell punctuation.definition.regex.group.shell"}},"end":"\\\\)","endCaptures":{"0":{"name":"punctuation.definition.group.shell punctuation.definition.regex.group.shell"}},"name":"meta.parenthese.shell","patterns":[{"include":"#case_statement_context"}]},{"begin":"\\\\[","beginCaptures":{"0":{"name":"punctuation.definition.character-class.shell"}},"end":"]","endCaptures":{"0":{"name":"punctuation.definition.character-class.shell"}},"name":"string.regexp.character-class.shell","patterns":[{"match":"\\\\\\\\.","name":"constant.character.escape.shell"}]},{"include":"#string"},{"match":"[^\\\\t\\\\n )*?@\\\\[|]","name":"string.unquoted.pattern.shell string.regexp.unquoted.shell"}]},"command_name_range":{"begin":"\\\\G","beginCaptures":{},"end":"(?=[\\\\t \\\\&;|]|$|[\\\\n)`])|(?=<)","endCaptures":{},"name":"meta.statement.command.name.shell","patterns":[{"match":"(?<!\\\\w)(?:continue|return|break)(?!\\\\w)","name":"entity.name.function.call.shell entity.name.command.shell keyword.control.$0.shell"},{"match":"(?<!\\\\w)(?:unfunction|continue|autoload|unsetopt|bindkey|builtin|getopts|command|declare|unalias|history|unlimit|typeset|suspend|source|printf|unhash|disown|ulimit|return|which|alias|break|false|print|shift|times|umask|unset|read|type|exec|eval|wait|echo|dirs|jobs|kill|hash|stat|exit|test|trap|true|let|set|pwd|cd|fg|bg|fc|[.:])(?!/)(?!\\\\w)(?!-)","name":"entity.name.function.call.shell entity.name.command.shell support.function.builtin.shell"},{"include":"#variable"},{"captures":{"1":{"name":"entity.name.function.call.shell entity.name.command.shell"}},"match":"(?<!\\\\w)(?<=\\\\G|[\\"\')}])([^\\\\t\\\\n\\\\r \\"\\\\&\');->`{|]+)"},{"begin":"(?:\\\\G|(?<![\\\\t\\\\n #\\\\&;{|]))(\\\\$?)((\\")|(\'))","beginCaptures":{"1":{"name":"meta.statement.command.name.quoted.shell punctuation.definition.string.shell entity.name.function.call.shell entity.name.command.shell"},"2":{},"3":{"name":"meta.statement.command.name.quoted.shell string.quoted.double.shell punctuation.definition.string.begin.shell entity.name.function.call.shell entity.name.command.shell"},"4":{"name":"meta.statement.command.name.quoted.shell string.quoted.single.shell punctuation.definition.string.begin.shell entity.name.function.call.shell entity.name.command.shell"}},"end":"(?<!\\\\G)(?<=\\\\2)","endCaptures":{},"patterns":[{"include":"#continuation_of_single_quoted_command_name"},{"include":"#continuation_of_double_quoted_command_name"}]},{"include":"#line_continuation"},{"include":"#simple_unquoted"}]},"command_statement":{"begin":"[\\\\t ]*+(?![\\\\n!#\\\\&()<>\\\\[{|]|$|[\\\\t ;])(?!nocorrect |nocorrect\\\\t|nocorrect$|readonly |readonly\\\\t|readonly$|function |function\\\\t|function$|foreach |foreach\\\\t|foreach$|coproc |coproc\\\\t|coproc$|logout |logout\\\\t|logout$|export |export\\\\t|export$|select |select\\\\t|select$|repeat |repeat\\\\t|repeat$|pushd |pushd\\\\t|pushd$|until |until\\\\t|until$|while |while\\\\t|while$|local |local\\\\t|local$|case |case\\\\t|case$|done |done\\\\t|done$|elif |elif\\\\t|elif$|else |else\\\\t|else$|esac |esac\\\\t|esac$|popd |popd\\\\t|popd$|then |then\\\\t|then$|time |time\\\\t|time$|for |for\\\\t|for$|end |end\\\\t|end$|fi |fi\\\\t|fi$|do |do\\\\t|do$|in |in\\\\t|in$|if |if\\\\t|if$)(?!\\\\\\\\\\\\n?$)","beginCaptures":{},"end":"(?=[\\\\n\\\\&);`{|}]|[\\\\t ]*#|])(?<!\\\\\\\\)","endCaptures":{},"name":"meta.statement.command.shell","patterns":[{"include":"#command_name_range"},{"include":"#line_continuation"},{"include":"#option"},{"include":"#argument"},{"include":"#string"},{"include":"#heredoc"}]},"comment":{"captures":{"1":{"name":"comment.line.number-sign.shell meta.shebang.shell"},"2":{"name":"punctuation.definition.comment.shebang.shell"},"3":{"name":"comment.line.number-sign.shell"},"4":{"name":"punctuation.definition.comment.shell"}},"match":"(?:^|[\\\\t ]++)(?:((#!).*)|((#).*))"},"comments":{"patterns":[{"include":"#block_comment"},{"include":"#line_comment"}]},"compound-command":{"patterns":[{"begin":"\\\\[","beginCaptures":{"0":{"name":"punctuation.definition.logical-expression.shell"}},"end":"]","endCaptures":{"0":{"name":"punctuation.definition.logical-expression.shell"}},"name":"meta.scope.logical-expression.shell","patterns":[{"include":"#logical-expression"},{"include":"#initial_context"}]},{"begin":"(?<=\\\\s|^)\\\\{(?=\\\\s|$)","beginCaptures":{"0":{"name":"punctuation.definition.group.shell"}},"end":"(?<=^|;)\\\\s*(})","endCaptures":{"1":{"name":"punctuation.definition.group.shell"}},"name":"meta.scope.group.shell","patterns":[{"include":"#initial_context"}]}]},"continuation_of_double_quoted_command_name":{"begin":"\\\\G(?<=\\")","beginCaptures":{},"contentName":"meta.statement.command.name.continuation string.quoted.double entity.name.function.call entity.name.command","end":"\\"","endCaptures":{"0":{"name":"string.quoted.double.shell punctuation.definition.string.end.shell entity.name.function.call.shell entity.name.command.shell"}},"patterns":[{"match":"\\\\\\\\[\\\\n\\"$\\\\\\\\`]","name":"constant.character.escape.shell"},{"include":"#variable"},{"include":"#interpolation"}]},"continuation_of_single_quoted_command_name":{"begin":"\\\\G(?<=\')","beginCaptures":{},"contentName":"meta.statement.command.name.continuation string.quoted.single entity.name.function.call entity.name.command","end":"\'","endCaptures":{"0":{"name":"string.quoted.single.shell punctuation.definition.string.end.shell entity.name.function.call.shell entity.name.command.shell"}}},"custom_command_names":{"patterns":[]},"custom_commands":{"patterns":[]},"double_quote_context":{"patterns":[{"match":"\\\\\\\\[\\\\n\\"$\\\\\\\\`]","name":"constant.character.escape.shell"},{"include":"#variable"},{"include":"#interpolation"}]},"double_quote_escape_char":{"match":"\\\\\\\\[\\\\n\\"$\\\\\\\\`]","name":"constant.character.escape.shell"},"floating_keyword":{"patterns":[{"match":"(?<=^|[\\\\t \\\\&;])(?:then|elif|else|done|end|do|if|fi)(?=[\\\\t \\\\&;]|$)","name":"keyword.control.$0.shell"}]},"for_statement":{"patterns":[{"begin":"\\\\b(for)\\\\b[\\\\t ]*+((?<!\\\\w)[-0-9A-Z_a-z]+(?!\\\\w))[\\\\t ]*+\\\\b(in)\\\\b","beginCaptures":{"1":{"name":"keyword.control.for.shell"},"2":{"name":"variable.other.for.shell"},"3":{"name":"keyword.control.in.shell"}},"end":"(?=[\\\\n\\\\&);`{|}]|[\\\\t ]*#|])(?<!\\\\\\\\)","endCaptures":{},"name":"meta.for.in.shell","patterns":[{"include":"#string"},{"include":"#simple_unquoted"},{"include":"#normal_context"}]},{"begin":"\\\\b(for)\\\\b","beginCaptures":{"1":{"name":"keyword.control.for.shell"}},"end":"(?=[\\\\n\\\\&);`{|}]|[\\\\t ]*#|])(?<!\\\\\\\\)","endCaptures":{},"name":"meta.for.shell","patterns":[{"include":"#arithmetic_double"},{"include":"#normal_context"}]}]},"function_definition":{"applyEndPatternLast":1,"begin":"[\\\\t ]*+(?:\\\\b(function)\\\\b[\\\\t ]*+([^\\\\t\\\\n\\\\r \\"\'()=]+)(?:(\\\\()[\\\\t ]*+(\\\\)))?|([^\\\\t\\\\n\\\\r \\"\'()=]+)[\\\\t ]*+(\\\\()[\\\\t ]*+(\\\\)))","beginCaptures":{"1":{"name":"storage.type.function.shell"},"2":{"name":"entity.name.function.shell"},"3":{"name":"punctuation.definition.arguments.shell"},"4":{"name":"punctuation.definition.arguments.shell"},"5":{"name":"entity.name.function.shell"},"6":{"name":"punctuation.definition.arguments.shell"},"7":{"name":"punctuation.definition.arguments.shell"}},"end":"(?<=[)}])","endCaptures":{},"name":"meta.function.shell","patterns":[{"match":"\\\\G[\\\\t\\\\n ]"},{"begin":"\\\\{","beginCaptures":{"0":{"name":"punctuation.definition.group.shell punctuation.section.function.definition.shell"}},"end":"}","endCaptures":{"0":{"name":"punctuation.definition.group.shell punctuation.section.function.definition.shell"}},"name":"meta.function.body.shell","patterns":[{"include":"#initial_context"}]},{"begin":"\\\\(","beginCaptures":{"0":{"name":"punctuation.definition.group.shell punctuation.section.function.definition.shell"}},"end":"\\\\)","endCaptures":{"0":{"name":"punctuation.definition.group.shell punctuation.section.function.definition.shell"}},"name":"meta.function.body.shell","patterns":[{"include":"#initial_context"}]},{"include":"#initial_context"}]},"heredoc":{"patterns":[{"begin":"((?<!<)<<-)[\\\\t ]*+([\\"\'])[\\\\t ]*+([^\\"\']+?)(?=[\\"\\\\&\';<\\\\s])(\\\\2)(.*)","beginCaptures":{"1":{"name":"keyword.operator.heredoc.shell"},"2":{"name":"punctuation.definition.string.heredoc.quote.shell"},"3":{"name":"punctuation.definition.string.heredoc.delimiter.shell"},"4":{"name":"punctuation.definition.string.heredoc.quote.shell"},"5":{"patterns":[{"include":"#redirect_fix"},{"include":"#typical_statements"}]}},"contentName":"string.quoted.heredoc.indent.$3","end":"^\\\\t*\\\\3(?=[\\\\&;\\\\s]|$)","endCaptures":{"0":{"name":"punctuation.definition.string.heredoc.$0.shell"}},"patterns":[]},{"begin":"((?<!<)<<(?!<))[\\\\t ]*+([\\"\'])[\\\\t ]*+([^\\"\']+?)(?=[\\"\\\\&\';<\\\\s])(\\\\2)(.*)","beginCaptures":{"1":{"name":"keyword.operator.heredoc.shell"},"2":{"name":"punctuation.definition.string.heredoc.quote.shell"},"3":{"name":"punctuation.definition.string.heredoc.delimiter.shell"},"4":{"name":"punctuation.definition.string.heredoc.quote.shell"},"5":{"patterns":[{"include":"#redirect_fix"},{"include":"#typical_statements"}]}},"contentName":"string.quoted.heredoc.no-indent.$3","end":"^\\\\3(?=[\\\\&;\\\\s]|$)","endCaptures":{"0":{"name":"punctuation.definition.string.heredoc.delimiter.shell"}},"patterns":[]},{"begin":"((?<!<)<<-)[\\\\t ]*+([^\\\\t \\"\']+)(?=[\\"\\\\&\';<\\\\s])(.*)","beginCaptures":{"1":{"name":"keyword.operator.heredoc.shell"},"2":{"name":"punctuation.definition.string.heredoc.delimiter.shell"},"3":{"patterns":[{"include":"#redirect_fix"},{"include":"#typical_statements"}]}},"contentName":"string.unquoted.heredoc.indent.$2","end":"^\\\\t*\\\\2(?=[\\\\&;\\\\s]|$)","endCaptures":{"0":{"name":"punctuation.definition.string.heredoc.delimiter.shell"}},"patterns":[{"include":"#double_quote_escape_char"},{"include":"#variable"},{"include":"#interpolation"}]},{"begin":"((?<!<)<<(?!<))[\\\\t ]*+([^\\\\t \\"\']+)(?=[\\"\\\\&\';<\\\\s])(.*)","beginCaptures":{"1":{"name":"keyword.operator.heredoc.shell"},"2":{"name":"punctuation.definition.string.heredoc.delimiter.shell"},"3":{"patterns":[{"include":"#redirect_fix"},{"include":"#typical_statements"}]}},"contentName":"string.unquoted.heredoc.no-indent.$2","end":"^\\\\2(?=[\\\\&;\\\\s]|$)","endCaptures":{"0":{"name":"punctuation.definition.string.heredoc.delimiter.shell"}},"patterns":[{"include":"#double_quote_escape_char"},{"include":"#variable"},{"include":"#interpolation"}]}]},"herestring":{"patterns":[{"begin":"(<<<)\\\\s*((\'))","beginCaptures":{"1":{"name":"keyword.operator.herestring.shell"},"2":{"name":"string.quoted.single.shell"},"3":{"name":"punctuation.definition.string.begin.shell"}},"contentName":"string.quoted.single.shell","end":"(\')","endCaptures":{"0":{"name":"string.quoted.single.shell"},"1":{"name":"punctuation.definition.string.end.shell"}},"name":"meta.herestring.shell"},{"begin":"(<<<)\\\\s*((\\"))","beginCaptures":{"1":{"name":"keyword.operator.herestring.shell"},"2":{"name":"string.quoted.double.shell"},"3":{"name":"punctuation.definition.string.begin.shell"}},"contentName":"string.quoted.double.shell","end":"(\\")","endCaptures":{"0":{"name":"string.quoted.double.shell"},"1":{"name":"punctuation.definition.string.end.shell"}},"name":"meta.herestring.shell","patterns":[{"include":"#double_quote_context"}]},{"captures":{"1":{"name":"keyword.operator.herestring.shell"},"2":{"name":"string.unquoted.herestring.shell","patterns":[{"include":"#initial_context"}]}},"match":"(<<<)\\\\s*(([^)\\\\\\\\\\\\s]|\\\\\\\\.)+)","name":"meta.herestring.shell"}]},"initial_context":{"patterns":[{"include":"#comment"},{"include":"#pipeline"},{"include":"#normal_statement_seperator"},{"include":"#logical_expression_double"},{"include":"#logical_expression_single"},{"include":"#assignment_statement"},{"include":"#case_statement"},{"include":"#for_statement"},{"include":"#loop"},{"include":"#function_definition"},{"include":"#line_continuation"},{"include":"#arithmetic_double"},{"include":"#misc_ranges"},{"include":"#variable"},{"include":"#interpolation"},{"include":"#heredoc"},{"include":"#herestring"},{"include":"#redirection"},{"include":"#pathname"},{"include":"#floating_keyword"},{"include":"#alias_statement"},{"include":"#normal_statement"},{"include":"#string"},{"include":"#support"}]},"inline_comment":{"captures":{"1":{"name":"comment.block.shell punctuation.definition.comment.begin.shell"},"2":{"name":"comment.block.shell"},"3":{"patterns":[{"match":"\\\\*/","name":"comment.block.shell punctuation.definition.comment.end.shell"},{"match":"\\\\*","name":"comment.block.shell"}]}},"match":"(/\\\\*)((?:[^*]|\\\\*++[^/])*+(\\\\*++/))"},"interpolation":{"patterns":[{"include":"#arithmetic_dollar"},{"include":"#subshell_dollar"},{"begin":"`","beginCaptures":{"0":{"name":"punctuation.definition.evaluation.backticks.shell"}},"end":"`","endCaptures":{"0":{"name":"punctuation.definition.evaluation.backticks.shell"}},"name":"string.interpolated.backtick.shell","patterns":[{"match":"\\\\\\\\[$\\\\\\\\`]","name":"constant.character.escape.shell"},{"begin":"(?<=\\\\W)(?=#)(?!#\\\\{)","beginCaptures":{"1":{"name":"punctuation.whitespace.comment.leading.shell"}},"end":"(?!\\\\G)","patterns":[{"begin":"#","beginCaptures":{"0":{"name":"punctuation.definition.comment.shell"}},"end":"(?=`)","name":"comment.line.number-sign.shell"}]},{"include":"#initial_context"}]}]},"keyword":{"patterns":[{"match":"(?<=^|[\\\\&;\\\\s])(then|else|elif|fi|for|in|do|done|select|continue|esac|while|until|return)(?=[\\\\&;\\\\s]|$)","name":"keyword.control.shell"},{"match":"(?<=^|[\\\\&;\\\\s])(?:export|declare|typeset|local|readonly)(?=[\\\\&;\\\\s]|$)","name":"storage.modifier.shell"}]},"line_comment":{"begin":"\\\\s*+(//)","beginCaptures":{"1":{"name":"punctuation.definition.comment.shell"}},"end":"(?<=\\\\n)(?<!\\\\\\\\\\\\n)","endCaptures":{},"name":"comment.line.double-slash.shell","patterns":[{"include":"#line_continuation_character"}]},"line_continuation":{"match":"\\\\\\\\(?=\\\\n)","name":"constant.character.escape.line-continuation.shell"},"logical-expression":{"patterns":[{"include":"#arithmetic_no_dollar"},{"match":"=[=~]?|!=?|[<>]|&&|\\\\|\\\\|","name":"keyword.operator.logical.shell"},{"match":"(?<!\\\\S)-(nt|ot|ef|eq|ne|l[et]|g[et]|[GLNOSa-hknopr-uwxz])\\\\b","name":"keyword.operator.logical.shell"}]},"logical_expression_context":{"patterns":[{"include":"#regex_comparison"},{"include":"#arithmetic_no_dollar"},{"include":"#logical-expression"},{"include":"#logical_expression_single"},{"include":"#logical_expression_double"},{"include":"#comment"},{"include":"#boolean"},{"include":"#redirect_number"},{"include":"#numeric_literal"},{"include":"#pipeline"},{"include":"#normal_statement_seperator"},{"include":"#string"},{"include":"#variable"},{"include":"#interpolation"},{"include":"#heredoc"},{"include":"#herestring"},{"include":"#pathname"},{"include":"#floating_keyword"},{"include":"#support"}]},"logical_expression_double":{"begin":"\\\\[\\\\[","beginCaptures":{"0":{"name":"punctuation.definition.logical-expression.shell"}},"end":"]]","endCaptures":{"0":{"name":"punctuation.definition.logical-expression.shell"}},"name":"meta.scope.logical-expression.shell","patterns":[{"include":"#logical_expression_context"}]},"logical_expression_single":{"begin":"\\\\[","beginCaptures":{"0":{"name":"punctuation.definition.logical-expression.shell"}},"end":"]","endCaptures":{"0":{"name":"punctuation.definition.logical-expression.shell"}},"name":"meta.scope.logical-expression.shell","patterns":[{"include":"#logical_expression_context"}]},"loop":{"patterns":[{"begin":"(?<=^|[\\\\&;\\\\s])(for)\\\\s+(.+?)\\\\s+(in)(?=[\\\\&;\\\\s]|$)","beginCaptures":{"1":{"name":"keyword.control.shell"},"2":{"name":"variable.other.loop.shell","patterns":[{"include":"#string"}]},"3":{"name":"keyword.control.shell"}},"end":"(?<=^|[\\\\&;\\\\s])done(?=[\\\\&;\\\\s]|$|\\\\))","endCaptures":{"0":{"name":"keyword.control.shell"}},"name":"meta.scope.for-in-loop.shell","patterns":[{"include":"#initial_context"}]},{"begin":"(?<=^|[\\\\&;\\\\s])(while|until)(?=[\\\\&;\\\\s]|$)","beginCaptures":{"1":{"name":"keyword.control.shell"}},"end":"(?<=^|[\\\\&;\\\\s])done(?=[\\\\&;\\\\s]|$|\\\\))","endCaptures":{"0":{"name":"keyword.control.shell"}},"name":"meta.scope.while-loop.shell","patterns":[{"include":"#initial_context"}]},{"begin":"(?<=^|[\\\\&;\\\\s])(select)\\\\s+((?:[^\\\\\\\\\\\\s]|\\\\\\\\.)+)(?=[\\\\&;\\\\s]|$)","beginCaptures":{"1":{"name":"keyword.control.shell"},"2":{"name":"variable.other.loop.shell"}},"end":"(?<=^|[\\\\&;\\\\s])(done)(?=[\\\\&;\\\\s]|$|\\\\))","endCaptures":{"1":{"name":"keyword.control.shell"}},"name":"meta.scope.select-block.shell","patterns":[{"include":"#initial_context"}]},{"begin":"(?<=^|[\\\\&;\\\\s])if(?=[\\\\&;\\\\s]|$)","beginCaptures":{"0":{"name":"keyword.control.if.shell"}},"end":"(?<=^|[\\\\&;\\\\s])fi(?=[\\\\&;\\\\s]|$)","endCaptures":{"0":{"name":"keyword.control.fi.shell"}},"name":"meta.scope.if-block.shell","patterns":[{"include":"#initial_context"}]}]},"math":{"patterns":[{"include":"#variable"},{"match":"\\\\+{1,2}|-{1,2}|[!~]|\\\\*{1,2}|[%/]|<[<=]?|>[=>]?|==|!=|^|\\\\|{1,2}|&{1,2}|[,:=?]|[-%\\\\&*+/^|]=|<<=|>>=","name":"keyword.operator.arithmetic.shell"},{"match":"0[Xx]\\\\h+","name":"constant.numeric.hex.shell"},{"match":";","name":"punctuation.separator.semicolon.range"},{"match":"0\\\\d+","name":"constant.numeric.octal.shell"},{"match":"\\\\d{1,2}#[0-9@-Z_a-z]+","name":"constant.numeric.other.shell"},{"match":"\\\\d+","name":"constant.numeric.integer.shell"},{"match":"(?<!\\\\w)[0-9A-Z_a-z]+(?!\\\\w)","name":"variable.other.normal.shell"}]},"math_operators":{"patterns":[{"match":"\\\\+{1,2}|-{1,2}|[!~]|\\\\*{1,2}|[%/]|<[<=]?|>[=>]?|==|!=|^|\\\\|{1,2}|&{1,2}|[,:=?]|[-%\\\\&*+/^|]=|<<=|>>=","name":"keyword.operator.arithmetic.shell"},{"match":"0[Xx]\\\\h+","name":"constant.numeric.hex.shell"},{"match":"0\\\\d+","name":"constant.numeric.octal.shell"},{"match":"\\\\d{1,2}#[0-9@-Z_a-z]+","name":"constant.numeric.other.shell"},{"match":"\\\\d+","name":"constant.numeric.integer.shell"}]},"misc_ranges":{"patterns":[{"include":"#logical_expression_single"},{"include":"#logical_expression_double"},{"include":"#subshell_dollar"},{"begin":"(?<![^\\\\t ])(\\\\{)(?![$\\\\w])","beginCaptures":{"1":{"name":"punctuation.definition.group.shell"}},"end":"}","endCaptures":{"0":{"name":"punctuation.definition.group.shell"}},"name":"meta.scope.group.shell","patterns":[{"include":"#initial_context"}]}]},"modified_assignment_statement":{"begin":"(?<=^|[\\\\t \\\\&;])(?:readonly|declare|typeset|export|local)(?=[\\\\t \\\\&;]|$)","beginCaptures":{"0":{"name":"storage.modifier.$0.shell"}},"end":"(?=[\\\\n\\\\&);`{|}]|[\\\\t ]*#|])(?<!\\\\\\\\)","endCaptures":{},"name":"meta.statement.shell meta.expression.assignment.modified.shell","patterns":[{"match":"(?<!\\\\w)-\\\\w+\\\\b","name":"string.unquoted.argument.shell constant.other.option.shell"},{"include":"#array_value"},{"captures":{"1":{"name":"variable.other.assignment.shell"},"2":{"name":"punctuation.definition.array.access.shell"},"3":{"name":"variable.other.assignment.shell"},"4":{"name":"constant.numeric.shell constant.numeric.integer.shell"},"5":{"name":"punctuation.definition.array.access.shell"},"6":{"name":"keyword.operator.assignment.shell"},"7":{"name":"keyword.operator.assignment.compound.shell"},"8":{"name":"keyword.operator.assignment.compound.shell"},"9":{"name":"constant.numeric.shell constant.numeric.hex.shell"},"10":{"name":"constant.numeric.shell constant.numeric.octal.shell"},"11":{"name":"constant.numeric.shell constant.numeric.other.shell"},"12":{"name":"constant.numeric.shell constant.numeric.decimal.shell"},"13":{"name":"constant.numeric.shell constant.numeric.version.shell"},"14":{"name":"constant.numeric.shell constant.numeric.integer.shell"}},"match":"((?<!\\\\w)[-0-9A-Z_a-z]+(?!\\\\w))(?:(\\\\[)((?:(?:\\\\$?(?<!\\\\w)[-0-9A-Z_a-z]+(?!\\\\w)|@)|\\\\*)|(-?\\\\d+))(]))?(?:(?:(=)|(\\\\+=))|(-=))?(?:(?<=[\\\\t =]|^|[(\\\\[{])(?:(?:(?:(?:(?:(0[Xx]\\\\h+)|(0\\\\d+))|(\\\\d{1,2}#[0-9@-Z_a-z]+))|(-?\\\\d+\\\\.\\\\d+))|(-?\\\\d+(?:\\\\.\\\\d+)+))|(-?\\\\d+))(?=[\\\\t ]|$|[);}]))?"},{"include":"#normal_context"}]},"modifiers":{"match":"(?<=^|[\\\\t \\\\&;])(?:readonly|declare|typeset|export|local)(?=[\\\\t \\\\&;]|$)","name":"storage.modifier.$0.shell"},"normal_assignment_statement":{"begin":"[\\\\t ]*+((?<!\\\\w)[-0-9A-Z_a-z]+(?!\\\\w))(?:(\\\\[)((?:(?:\\\\$?(?<!\\\\w)[-0-9A-Z_a-z]+(?!\\\\w)|@)|\\\\*)|(-?\\\\d+))(]))?(?:(?:(=)|(\\\\+=))|(-=))","beginCaptures":{"1":{"name":"variable.other.assignment.shell"},"2":{"name":"punctuation.definition.array.access.shell"},"3":{"name":"variable.other.assignment.shell"},"4":{"name":"constant.numeric.shell constant.numeric.integer.shell"},"5":{"name":"punctuation.definition.array.access.shell"},"6":{"name":"keyword.operator.assignment.shell"},"7":{"name":"keyword.operator.assignment.compound.shell"},"8":{"name":"keyword.operator.assignment.compound.shell"}},"end":"(?=[\\\\n\\\\&);`{|}]|[\\\\t ]*#|])(?<!\\\\\\\\)","endCaptures":{},"name":"meta.expression.assignment.shell","patterns":[{"include":"#comment"},{"include":"#string"},{"include":"#normal_assignment_statement"},{"begin":"(?<=[\\\\t ])(?![\\\\t ]|\\\\w+=)","beginCaptures":{},"end":"(?=[\\\\n\\\\&);`{|}]|[\\\\t ]*#|])(?<!\\\\\\\\)","endCaptures":{},"name":"meta.statement.command.env.shell","patterns":[{"include":"#command_name_range"},{"include":"#line_continuation"},{"include":"#option"},{"include":"#argument"},{"include":"#string"}]},{"include":"#simple_unquoted"},{"include":"#normal_context"}]},"normal_context":{"patterns":[{"include":"#comment"},{"include":"#pipeline"},{"include":"#normal_statement_seperator"},{"include":"#misc_ranges"},{"include":"#boolean"},{"include":"#redirect_number"},{"include":"#numeric_literal"},{"include":"#string"},{"include":"#variable"},{"include":"#interpolation"},{"include":"#heredoc"},{"include":"#herestring"},{"include":"#redirection"},{"include":"#pathname"},{"include":"#floating_keyword"},{"include":"#support"},{"include":"#parenthese"}]},"normal_statement":{"begin":"(?!^[\\\\t ]*+$)(?:(?<=(?:^until| until|\\\\tuntil|^while| while|\\\\twhile|^elif| elif|\\\\telif|^else| else|\\\\telse|^then| then|\\\\tthen|^do| do|\\\\tdo|^if| if|\\\\tif) )|(?<=^|[!\\\\&(;`{|]))[\\\\t ]*+(?!nocorrect\\\\W|nocorrect\\\\$|function\\\\W|function\\\\$|foreach\\\\W|foreach\\\\$|repeat\\\\W|repeat\\\\$|logout\\\\W|logout\\\\$|coproc\\\\W|coproc\\\\$|select\\\\W|select\\\\$|while\\\\W|while\\\\$|pushd\\\\W|pushd\\\\$|until\\\\W|until\\\\$|case\\\\W|case\\\\$|done\\\\W|done\\\\$|elif\\\\W|elif\\\\$|else\\\\W|else\\\\$|esac\\\\W|esac\\\\$|popd\\\\W|popd\\\\$|then\\\\W|then\\\\$|time\\\\W|time\\\\$|for\\\\W|for\\\\$|end\\\\W|end\\\\$|fi\\\\W|fi\\\\$|do\\\\W|do\\\\$|in\\\\W|in\\\\$|if\\\\W|if\\\\$)","beginCaptures":{},"end":"(?=[\\\\n\\\\&);`{|}]|[\\\\t ]*#|])(?<!\\\\\\\\)","endCaptures":{},"name":"meta.statement.shell","patterns":[{"include":"#typical_statements"}]},"normal_statement_seperator":{"captures":{"1":{"name":"punctuation.terminator.statement.semicolon.shell"},"2":{"name":"punctuation.separator.statement.and.shell"},"3":{"name":"punctuation.separator.statement.or.shell"},"4":{"name":"punctuation.separator.statement.background.shell"}},"match":"(?:(?:(;)|(&&))|(\\\\|\\\\|))|(&)"},"numeric_literal":{"captures":{"1":{"name":"constant.numeric.shell constant.numeric.hex.shell"},"2":{"name":"constant.numeric.shell constant.numeric.octal.shell"},"3":{"name":"constant.numeric.shell constant.numeric.other.shell"},"4":{"name":"constant.numeric.shell constant.numeric.decimal.shell"},"5":{"name":"constant.numeric.shell constant.numeric.version.shell"},"6":{"name":"constant.numeric.shell constant.numeric.integer.shell"}},"match":"(?<=[\\\\t =]|^|[(\\\\[{])(?:(?:(?:(?:(?:(0[Xx]\\\\h+)|(0\\\\d+))|(\\\\d{1,2}#[0-9@-Z_a-z]+))|(-?\\\\d+\\\\.\\\\d+))|(-?\\\\d+(?:\\\\.\\\\d+)+))|(-?\\\\d+))(?=[\\\\t ]|$|[);}])"},"option":{"begin":"[\\\\t ]++(-)((?![\\\\n!#\\\\&()<>\\\\[{|]|$|[\\\\t ;]))","beginCaptures":{"1":{"name":"string.unquoted.argument.shell constant.other.option.dash.shell"},"2":{"name":"string.unquoted.argument.shell constant.other.option.shell"}},"contentName":"string.unquoted.argument constant.other.option","end":"(?=[\\\\t ])|(?=[\\\\n\\\\&);`{|}]|[\\\\t ]*#|])(?<!\\\\\\\\)","endCaptures":{},"patterns":[{"include":"#option_context"}]},"option_context":{"patterns":[{"include":"#misc_ranges"},{"include":"#string"},{"include":"#variable"},{"include":"#interpolation"},{"include":"#heredoc"},{"include":"#herestring"},{"include":"#redirection"},{"include":"#pathname"},{"include":"#floating_keyword"},{"include":"#support"}]},"parenthese":{"patterns":[{"begin":"\\\\(","beginCaptures":{"0":{"name":"punctuation.section.parenthese.shell"}},"end":"\\\\)","endCaptures":{"0":{"name":"punctuation.section.parenthese.shell"}},"name":"meta.parenthese.group.shell","patterns":[{"include":"#initial_context"}]}]},"pathname":{"patterns":[{"match":"(?<=[:=\\\\s]|^)~","name":"keyword.operator.tilde.shell"},{"match":"[*?]","name":"keyword.operator.glob.shell"},{"begin":"([!*+?@])(\\\\()","beginCaptures":{"1":{"name":"keyword.operator.extglob.shell"},"2":{"name":"punctuation.definition.extglob.shell"}},"end":"\\\\)","endCaptures":{"0":{"name":"punctuation.definition.extglob.shell"}},"name":"meta.structure.extglob.shell","patterns":[{"include":"#initial_context"}]}]},"pipeline":{"patterns":[{"match":"(?<=^|[\\\\&;\\\\s])(time)(?=[\\\\&;\\\\s]|$)","name":"keyword.other.shell"},{"match":"[!|]","name":"keyword.operator.pipe.shell"}]},"redirect_fix":{"captures":{"1":{"name":"keyword.operator.redirect.shell"},"2":{"name":"string.unquoted.argument.shell"}},"match":"(>>?)[\\\\t ]*+([^\\\\t\\\\n \\"$\\\\&-);<>\\\\\\\\`|]+)"},"redirect_number":{"captures":{"1":{"name":"keyword.operator.redirect.stdout.shell"},"2":{"name":"keyword.operator.redirect.stderr.shell"},"3":{"name":"keyword.operator.redirect.$3.shell"}},"match":"(?<=[\\\\t ])(?:(1)|(2)|(\\\\d+))(?=>)"},"redirection":{"patterns":[{"begin":"[<>]\\\\(","beginCaptures":{"0":{"name":"punctuation.definition.string.begin.shell"}},"end":"\\\\)","endCaptures":{"0":{"name":"punctuation.definition.string.end.shell"}},"name":"string.interpolated.process-substitution.shell","patterns":[{"include":"#initial_context"}]},{"match":"(?<![<>])(&>|\\\\d*>&\\\\d*|\\\\d*(>>|[<>])|\\\\d*<&|\\\\d*<>)(?![<>])","name":"keyword.operator.redirect.shell"}]},"regex_comparison":{"match":"=~","name":"keyword.operator.logical.regex.shell"},"regexp":{"patterns":[{"match":".+"}]},"simple_options":{"captures":{"0":{"patterns":[{"captures":{"1":{"name":"string.unquoted.argument.shell constant.other.option.dash.shell"},"2":{"name":"string.unquoted.argument.shell constant.other.option.shell"}},"match":"[\\\\t ]++(-)(\\\\w+)"}]}},"match":"(?:[\\\\t ]++-\\\\w+)*"},"simple_unquoted":{"match":"[^\\\\t\\\\n \\"$\\\\&-);<>\\\\\\\\`|]","name":"string.unquoted.shell"},"special_expansion":{"match":"!|:[-=?]?|[*@]|##?|%%|[%/]","name":"keyword.operator.expansion.shell"},"start_of_command":{"match":"[\\\\t ]*+(?![\\\\n!#\\\\&()<>\\\\[{|]|$|[\\\\t ;])(?!nocorrect |nocorrect\\\\t|nocorrect$|readonly |readonly\\\\t|readonly$|function |function\\\\t|function$|foreach |foreach\\\\t|foreach$|coproc |coproc\\\\t|coproc$|logout |logout\\\\t|logout$|export |export\\\\t|export$|select |select\\\\t|select$|repeat |repeat\\\\t|repeat$|pushd |pushd\\\\t|pushd$|until |until\\\\t|until$|while |while\\\\t|while$|local |local\\\\t|local$|case |case\\\\t|case$|done |done\\\\t|done$|elif |elif\\\\t|elif$|else |else\\\\t|else$|esac |esac\\\\t|esac$|popd |popd\\\\t|popd$|then |then\\\\t|then$|time |time\\\\t|time$|for |for\\\\t|for$|end |end\\\\t|end$|fi |fi\\\\t|fi$|do |do\\\\t|do$|in |in\\\\t|in$|if |if\\\\t|if$)(?!\\\\\\\\\\\\n?$)"},"string":{"patterns":[{"match":"\\\\\\\\.","name":"constant.character.escape.shell"},{"begin":"\'","beginCaptures":{"0":{"name":"punctuation.definition.string.begin.shell"}},"end":"\'","endCaptures":{"0":{"name":"punctuation.definition.string.end.shell"}},"name":"string.quoted.single.shell"},{"begin":"\\\\$?\\"","beginCaptures":{"0":{"name":"punctuation.definition.string.begin.shell"}},"end":"\\"","endCaptures":{"0":{"name":"punctuation.definition.string.end.shell"}},"name":"string.quoted.double.shell","patterns":[{"match":"\\\\\\\\[\\\\n\\"$\\\\\\\\`]","name":"constant.character.escape.shell"},{"include":"#variable"},{"include":"#interpolation"}]},{"begin":"\\\\$\'","beginCaptures":{"0":{"name":"punctuation.definition.string.begin.shell"}},"end":"\'","endCaptures":{"0":{"name":"punctuation.definition.string.end.shell"}},"name":"string.quoted.single.dollar.shell","patterns":[{"match":"\\\\\\\\[\'\\\\\\\\abefnrtv]","name":"constant.character.escape.ansi-c.shell"},{"match":"\\\\\\\\[0-9]{3}\\"","name":"constant.character.escape.octal.shell"},{"match":"\\\\\\\\x\\\\h{2}\\"","name":"constant.character.escape.hex.shell"},{"match":"\\\\\\\\c.\\"","name":"constant.character.escape.control-char.shell"}]}]},"subshell_dollar":{"patterns":[{"begin":"\\\\$\\\\(","beginCaptures":{"0":{"name":"punctuation.definition.subshell.single.shell"}},"end":"\\\\)","endCaptures":{"0":{"name":"punctuation.definition.subshell.single.shell"}},"name":"meta.scope.subshell","patterns":[{"include":"#parenthese"},{"include":"#initial_context"}]}]},"support":{"patterns":[{"match":"(?<=^|[\\\\&;\\\\s])[.:](?=[\\\\&;\\\\s]|$)","name":"support.function.builtin.shell"}]},"typical_statements":{"patterns":[{"include":"#assignment_statement"},{"include":"#case_statement"},{"include":"#for_statement"},{"include":"#while_statement"},{"include":"#function_definition"},{"include":"#command_statement"},{"include":"#line_continuation"},{"include":"#arithmetic_double"},{"include":"#normal_context"}]},"variable":{"patterns":[{"captures":{"1":{"name":"punctuation.definition.variable.shell variable.parameter.positional.all.shell"},"2":{"name":"variable.parameter.positional.all.shell"}},"match":"(\\\\$)(@(?!\\\\w))"},{"captures":{"1":{"name":"punctuation.definition.variable.shell variable.parameter.positional.shell"},"2":{"name":"variable.parameter.positional.shell"}},"match":"(\\\\$)([0-9](?!\\\\w))"},{"captures":{"1":{"name":"punctuation.definition.variable.shell variable.language.special.shell"},"2":{"name":"variable.language.special.shell"}},"match":"(\\\\$)([-!#$*0?_](?!\\\\w))"},{"begin":"(\\\\$)(\\\\{)[\\\\t ]*+(?=\\\\d)","beginCaptures":{"1":{"name":"punctuation.definition.variable.shell variable.parameter.positional.shell"},"2":{"name":"punctuation.section.bracket.curly.variable.begin.shell punctuation.definition.variable.shell variable.parameter.positional.shell"}},"contentName":"meta.parameter-expansion","end":"}","endCaptures":{"0":{"name":"punctuation.section.bracket.curly.variable.end.shell punctuation.definition.variable.shell variable.parameter.positional.shell"}},"patterns":[{"include":"#special_expansion"},{"include":"#array_access_inline"},{"match":"[0-9]+","name":"variable.parameter.positional.shell"},{"match":"(?<!\\\\w)[-0-9A-Z_a-z]+(?!\\\\w)","name":"variable.other.normal.shell"},{"include":"#variable"},{"include":"#string"}]},{"begin":"(\\\\$)(\\\\{)","beginCaptures":{"1":{"name":"punctuation.definition.variable.shell"},"2":{"name":"punctuation.section.bracket.curly.variable.begin.shell punctuation.definition.variable.shell"}},"contentName":"meta.parameter-expansion","end":"}","endCaptures":{"0":{"name":"punctuation.section.bracket.curly.variable.end.shell punctuation.definition.variable.shell"}},"patterns":[{"include":"#special_expansion"},{"include":"#array_access_inline"},{"match":"(?<!\\\\w)[-0-9A-Z_a-z]+(?!\\\\w)","name":"variable.other.normal.shell"},{"include":"#variable"},{"include":"#string"}]},{"captures":{"1":{"name":"punctuation.definition.variable.shell variable.other.normal.shell"},"2":{"name":"variable.other.normal.shell"}},"match":"(\\\\$)(\\\\w+(?!\\\\w))"}]},"while_statement":{"patterns":[{"begin":"\\\\b(while)\\\\b","beginCaptures":{"1":{"name":"keyword.control.while.shell"}},"end":"(?=[\\\\n\\\\&);`{|}]|[\\\\t ]*#|])(?<!\\\\\\\\)","endCaptures":{},"name":"meta.while.shell","patterns":[{"include":"#line_continuation"},{"include":"#math_operators"},{"include":"#option"},{"include":"#simple_unquoted"},{"include":"#normal_context"},{"include":"#string"}]}]}},"scopeName":"source.shell","aliases":["bash","sh","shell","zsh"]}',
        ),
      );
      e.s(["default", 0, [n]]);
    },
  ],
  [
    [77313, 228426],
    (e) => {
      "use strict";
      let t;
      var r,
        n,
        s = class extends Error {
          constructor(e) {
            (super(e), (this.name = "ShikiError"));
          }
        },
        a = e.i(247167);
      function i(e, ...t) {
        return (
          t.forEach((t) => {
            for (let r in t) e[r] = t[r];
          }),
          e
        );
      }
      var o = /\$(\d+)|\${(\d+):\/(downcase|upcase)}/g,
        l = class {
          static hasCaptures(e) {
            return null !== e && ((o.lastIndex = 0), o.test(e));
          }
          static replaceCaptures(e, t, r) {
            return e.replace(o, (e, n, s, a) => {
              let i = r[parseInt(n || s, 10)];
              if (!i) return e;
              {
                let e = t.substring(i.start, i.end);
                for (; "." === e[0];) e = e.substring(1);
                switch (a) {
                  case "downcase":
                    return e.toLowerCase();
                  case "upcase":
                    return e.toUpperCase();
                  default:
                    return e;
                }
              }
            });
          }
        };
      function c(e, t) {
        if (null === e && null === t) return 0;
        if (!e) return -1;
        if (!t) return 1;
        let r = e.length,
          n = t.length;
        if (r === n) {
          for (let n = 0; n < r; n++) {
            var s, a;
            let r = ((s = e[n]), s < (a = t[n]) ? -1 : +(s > a));
            if (0 !== r) return r;
          }
          return 0;
        }
        return r - n;
      }
      function u(e) {
        return !!(
          /^#[0-9a-f]{6}$/i.test(e) ||
          /^#[0-9a-f]{8}$/i.test(e) ||
          /^#[0-9a-f]{3}$/i.test(e) ||
          /^#[0-9a-f]{4}$/i.test(e)
        );
      }
      function h(e) {
        return e.replace(/[\-\\\{\}\*\+\?\|\^\$\.\,\[\]\(\)\#\s]/g, "\\$&");
      }
      var p = class {
          constructor(e) {
            this.fn = e;
          }
          fn;
          cache = new Map();
          get(e) {
            if (this.cache.has(e)) return this.cache.get(e);
            let t = this.fn(e);
            return (this.cache.set(e, t), t);
          }
        },
        d = class {
          constructor(e, t, r) {
            ((this._colorMap = e), (this._defaults = t), (this._root = r));
          }
          _colorMap;
          _defaults;
          _root;
          static createFromRawTheme(e, t) {
            return this.createFromParsedTheme(
              (function (e) {
                if (!e || !e.settings || !Array.isArray(e.settings)) return [];
                let t = e.settings,
                  r = [],
                  n = 0;
                for (let e = 0, s = t.length; e < s; e++) {
                  let s,
                    a = t[e];
                  if (!a.settings) continue;
                  if ("string" == typeof a.scope) {
                    let e = a.scope;
                    s = (e = (e = e.replace(/^[,]+/, "")).replace(
                      /[,]+$/,
                      "",
                    )).split(",");
                  } else s = Array.isArray(a.scope) ? a.scope : [""];
                  let i = -1;
                  if ("string" == typeof a.settings.fontStyle) {
                    i = 0;
                    let e = a.settings.fontStyle.split(" ");
                    for (let t = 0, r = e.length; t < r; t++)
                      switch (e[t]) {
                        case "italic":
                          i |= 1;
                          break;
                        case "bold":
                          i |= 2;
                          break;
                        case "underline":
                          i |= 4;
                          break;
                        case "strikethrough":
                          i |= 8;
                      }
                  }
                  let o = null;
                  "string" == typeof a.settings.foreground &&
                    u(a.settings.foreground) &&
                    (o = a.settings.foreground);
                  let l = null;
                  "string" == typeof a.settings.background &&
                    u(a.settings.background) &&
                    (l = a.settings.background);
                  for (let t = 0, a = s.length; t < a; t++) {
                    let a = s[t].trim().split(" "),
                      c = a[a.length - 1],
                      u = null;
                    (a.length > 1 && (u = a.slice(0, a.length - 1)).reverse(),
                      (r[n++] = new m(c, u, e, i, o, l)));
                  }
                }
                return r;
              })(e),
              t,
            );
          }
          static createFromParsedTheme(e, t) {
            return (function (e, t) {
              e.sort((e, t) => {
                var r, n;
                let s = ((r = e.scope), r < (n = t.scope) ? -1 : +(r > n));
                return 0 !== s || 0 !== (s = c(e.parentScopes, t.parentScopes))
                  ? s
                  : e.index - t.index;
              });
              let r = 0,
                n = "#000000",
                s = "#ffffff";
              for (; e.length >= 1 && "" === e[0].scope;) {
                let t = e.shift();
                (-1 !== t.fontStyle && (r = t.fontStyle),
                  null !== t.foreground && (n = t.foreground),
                  null !== t.background && (s = t.background));
              }
              let a = new b(t),
                i = new f(r, a.getId(n), a.getId(s)),
                o = new w(new k(0, null, -1, 0, 0), []);
              for (let t = 0, r = e.length; t < r; t++) {
                let r = e[t];
                o.insert(
                  0,
                  r.scope,
                  r.parentScopes,
                  r.fontStyle,
                  a.getId(r.foreground),
                  a.getId(r.background),
                );
              }
              return new d(a, i, o);
            })(e, t);
          }
          _cachedMatchRoot = new p((e) => this._root.match(e));
          getColorMap() {
            return this._colorMap.getColorMap();
          }
          getDefaults() {
            return this._defaults;
          }
          match(e) {
            if (null === e) return this._defaults;
            let t = e.scopeName,
              r = this._cachedMatchRoot.get(t).find((t) =>
                (function (e, t) {
                  if (0 === t.length) return !0;
                  for (let s = 0; s < t.length; s++) {
                    var r, n;
                    let a = t[s],
                      i = !1;
                    if (">" === a) {
                      if (s === t.length - 1) return !1;
                      ((a = t[++s]), (i = !0));
                    }
                    for (
                      ;
                      e &&
                      ((r = e.scopeName),
                      !(
                        (n = a) === r ||
                        (r.startsWith(n) && "." === r[n.length])
                      ));
                    ) {
                      if (i) return !1;
                      e = e.parent;
                    }
                    if (!e) return !1;
                    e = e.parent;
                  }
                  return !0;
                })(e.parent, t.parentScopes),
              );
            return r ? new f(r.fontStyle, r.foreground, r.background) : null;
          }
        },
        g = class e {
          constructor(e, t) {
            ((this.parent = e), (this.scopeName = t));
          }
          parent;
          scopeName;
          static push(t, r) {
            for (let n of r) t = new e(t, n);
            return t;
          }
          static from(...t) {
            let r = null;
            for (let n = 0; n < t.length; n++) r = new e(r, t[n]);
            return r;
          }
          push(t) {
            return new e(this, t);
          }
          getSegments() {
            let e = this,
              t = [];
            for (; e;) (t.push(e.scopeName), (e = e.parent));
            return (t.reverse(), t);
          }
          toString() {
            return this.getSegments().join(" ");
          }
          extends(e) {
            return (
              this === e || (null !== this.parent && this.parent.extends(e))
            );
          }
          getExtensionIfDefined(e) {
            let t = [],
              r = this;
            for (; r && r !== e;) (t.push(r.scopeName), (r = r.parent));
            return r === e ? t.reverse() : void 0;
          }
        },
        f = class {
          constructor(e, t, r) {
            ((this.fontStyle = e),
              (this.foregroundId = t),
              (this.backgroundId = r));
          }
          fontStyle;
          foregroundId;
          backgroundId;
        },
        m = class {
          constructor(e, t, r, n, s, a) {
            ((this.scope = e),
              (this.parentScopes = t),
              (this.index = r),
              (this.fontStyle = n),
              (this.foreground = s),
              (this.background = a));
          }
          scope;
          parentScopes;
          index;
          fontStyle;
          foreground;
          background;
        },
        y =
          (((r = y || {})[(r.NotSet = -1)] = "NotSet"),
          (r[(r.None = 0)] = "None"),
          (r[(r.Italic = 1)] = "Italic"),
          (r[(r.Bold = 2)] = "Bold"),
          (r[(r.Underline = 4)] = "Underline"),
          (r[(r.Strikethrough = 8)] = "Strikethrough"),
          r),
        b = class {
          _isFrozen;
          _lastColorId;
          _id2color;
          _color2id;
          constructor(e) {
            if (
              ((this._lastColorId = 0),
              (this._id2color = []),
              (this._color2id = Object.create(null)),
              Array.isArray(e))
            ) {
              this._isFrozen = !0;
              for (let t = 0, r = e.length; t < r; t++)
                ((this._color2id[e[t]] = t), (this._id2color[t] = e[t]));
            } else this._isFrozen = !1;
          }
          getId(e) {
            if (null === e) return 0;
            e = e.toUpperCase();
            let t = this._color2id[e];
            if (t) return t;
            if (this._isFrozen)
              throw Error(`Missing color in color map - ${e}`);
            return (
              (t = ++this._lastColorId),
              (this._color2id[e] = t),
              (this._id2color[t] = e),
              t
            );
          }
          getColorMap() {
            return this._id2color.slice(0);
          }
        },
        _ = Object.freeze([]),
        k = class e {
          scopeDepth;
          parentScopes;
          fontStyle;
          foreground;
          background;
          constructor(e, t, r, n, s) {
            ((this.scopeDepth = e),
              (this.parentScopes = t || _),
              (this.fontStyle = r),
              (this.foreground = n),
              (this.background = s));
          }
          clone() {
            return new e(
              this.scopeDepth,
              this.parentScopes,
              this.fontStyle,
              this.foreground,
              this.background,
            );
          }
          static cloneArr(e) {
            let t = [];
            for (let r = 0, n = e.length; r < n; r++) t[r] = e[r].clone();
            return t;
          }
          acceptOverwrite(e, t, r, n) {
            (this.scopeDepth > e
              ? console.log("how did this happen?")
              : (this.scopeDepth = e),
              -1 !== t && (this.fontStyle = t),
              0 !== r && (this.foreground = r),
              0 !== n && (this.background = n));
          }
        },
        w = class e {
          constructor(e, t = [], r = {}) {
            ((this._mainRule = e),
              (this._children = r),
              (this._rulesWithParentScopes = t));
          }
          _mainRule;
          _children;
          _rulesWithParentScopes;
          static _cmpBySpecificity(e, t) {
            if (e.scopeDepth !== t.scopeDepth)
              return t.scopeDepth - e.scopeDepth;
            let r = 0,
              n = 0;
            for (
              ;
              ">" === e.parentScopes[r] && r++,
                ">" === t.parentScopes[n] && n++,
                !(r >= e.parentScopes.length) && !(n >= t.parentScopes.length);
            ) {
              let s = t.parentScopes[n].length - e.parentScopes[r].length;
              if (0 !== s) return s;
              (r++, n++);
            }
            return t.parentScopes.length - e.parentScopes.length;
          }
          match(t) {
            if ("" !== t) {
              let e,
                r,
                n = t.indexOf(".");
              if (
                (-1 === n
                  ? ((e = t), (r = ""))
                  : ((e = t.substring(0, n)), (r = t.substring(n + 1))),
                this._children.hasOwnProperty(e))
              )
                return this._children[e].match(r);
            }
            let r = this._rulesWithParentScopes.concat(this._mainRule);
            return (r.sort(e._cmpBySpecificity), r);
          }
          insert(t, r, n, s, a, i) {
            let o, l, c;
            if ("" === r) return void this._doInsertHere(t, n, s, a, i);
            let u = r.indexOf(".");
            (-1 === u
              ? ((o = r), (l = ""))
              : ((o = r.substring(0, u)), (l = r.substring(u + 1))),
              this._children.hasOwnProperty(o)
                ? (c = this._children[o])
                : ((c = new e(
                    this._mainRule.clone(),
                    k.cloneArr(this._rulesWithParentScopes),
                  )),
                  (this._children[o] = c)),
              c.insert(t + 1, l, n, s, a, i));
          }
          _doInsertHere(e, t, r, n, s) {
            if (null === t)
              return void this._mainRule.acceptOverwrite(e, r, n, s);
            for (
              let a = 0, i = this._rulesWithParentScopes.length;
              a < i;
              a++
            ) {
              let i = this._rulesWithParentScopes[a];
              if (0 === c(i.parentScopes, t))
                return void i.acceptOverwrite(e, r, n, s);
            }
            (-1 === r && (r = this._mainRule.fontStyle),
              0 === n && (n = this._mainRule.foreground),
              0 === s && (s = this._mainRule.background),
              this._rulesWithParentScopes.push(new k(e, t, r, n, s)));
          }
        },
        C = class e {
          static toBinaryStr(e) {
            return e.toString(2).padStart(32, "0");
          }
          static print(t) {
            let r = e.getLanguageId(t),
              n = e.getTokenType(t),
              s = e.getFontStyle(t);
            console.log({
              languageId: r,
              tokenType: n,
              fontStyle: s,
              foreground: e.getForeground(t),
              background: e.getBackground(t),
            });
          }
          static getLanguageId(e) {
            return (255 & e) >>> 0;
          }
          static getTokenType(e) {
            return (768 & e) >>> 8;
          }
          static containsBalancedBrackets(e) {
            return (1024 & e) != 0;
          }
          static getFontStyle(e) {
            return (30720 & e) >>> 11;
          }
          static getForeground(e) {
            return (0xff8000 & e) >>> 15;
          }
          static getBackground(e) {
            return (0xff000000 & e) >>> 24;
          }
          static set(t, r, n, s, a, i, o) {
            let l = e.getLanguageId(t),
              c = e.getTokenType(t),
              u = +!!e.containsBalancedBrackets(t),
              h = e.getFontStyle(t),
              p = e.getForeground(t),
              d = e.getBackground(t);
            return (
              0 !== r && (l = r),
              8 !== n && (c = n),
              null !== s && (u = +!!s),
              -1 !== a && (h = a),
              0 !== i && (p = i),
              0 !== o && (d = o),
              (l | (c << 8) | (u << 10) | (h << 11) | (p << 15) | (d << 24)) >>>
                0
            );
          }
        };
      function S(e, t) {
        var r;
        let n,
          s,
          a = [],
          i =
            ((r = e),
            (s = (n = /([LR]:|[\w\.:][\w\.:\-]*|[\,\|\-\(\)])/g).exec(r)),
            {
              next: () => {
                if (!s) return null;
                let e = s[0];
                return ((s = n.exec(r)), e);
              },
            }),
          o = i.next();
        for (; null !== o;) {
          let e = 0;
          if (2 === o.length && ":" === o.charAt(1)) {
            switch (o.charAt(0)) {
              case "R":
                e = 1;
                break;
              case "L":
                e = -1;
                break;
              default:
                console.log(`Unknown priority ${o} in scope selector`);
            }
            o = i.next();
          }
          let t = c();
          if ((a.push({ matcher: t, priority: e }), "," !== o)) break;
          o = i.next();
        }
        return a;
        function l() {
          if ("-" === o) {
            o = i.next();
            let e = l();
            return (t) => !!e && !e(t);
          }
          if ("(" === o) {
            o = i.next();
            let e = (function () {
              let e = [],
                t = c();
              for (; t && (e.push(t), "|" === o || "," === o);) {
                do o = i.next();
                while ("|" === o || "," === o);
                t = c();
              }
              return (t) => e.some((e) => e(t));
            })();
            return (")" === o && (o = i.next()), e);
          }
          if (x(o)) {
            let e = [];
            do (e.push(o), (o = i.next()));
            while (x(o));
            return (r) => t(e, r);
          }
          return null;
        }
        function c() {
          let e = [],
            t = l();
          for (; t;) (e.push(t), (t = l()));
          return (t) => e.every((e) => e(t));
        }
      }
      function x(e) {
        return !!e && !!e.match(/[\w\.:]+/);
      }
      var v =
        (((n = v || {})[(n.None = 0)] = "None"),
        (n[(n.NotBeginString = 1)] = "NotBeginString"),
        (n[(n.NotEndString = 2)] = "NotEndString"),
        (n[(n.NotBeginPosition = 4)] = "NotBeginPosition"),
        (n[(n.DebugCall = 8)] = "DebugCall"),
        n);
      function A(e) {
        "function" == typeof e.dispose && e.dispose();
      }
      var N = class {
          constructor(e) {
            this.scopeName = e;
          }
          scopeName;
          toKey() {
            return this.scopeName;
          }
        },
        E = class {
          constructor(e, t) {
            ((this.scopeName = e), (this.ruleName = t));
          }
          scopeName;
          ruleName;
          toKey() {
            return `${this.scopeName}#${this.ruleName}`;
          }
        },
        I = class {
          _references = [];
          _seenReferenceKeys = new Set();
          get references() {
            return this._references;
          }
          visitedRule = new Set();
          add(e) {
            let t = e.toKey();
            this._seenReferenceKeys.has(t) ||
              (this._seenReferenceKeys.add(t), this._references.push(e));
          }
        },
        $ = class {
          constructor(e, t) {
            ((this.repo = e),
              (this.initialScopeName = t),
              this.seenFullScopeRequests.add(this.initialScopeName),
              (this.Q = [new N(this.initialScopeName)]));
          }
          repo;
          initialScopeName;
          seenFullScopeRequests = new Set();
          seenPartialScopeRequests = new Set();
          Q;
          processQueue() {
            let e = this.Q;
            this.Q = [];
            let t = new I();
            for (let r of e)
              !(function (e, t, r, n) {
                let s = r.lookup(e.scopeName);
                if (!s) {
                  if (e.scopeName === t)
                    throw Error(`No grammar provided for <${t}>`);
                  return;
                }
                let a = r.lookup(t);
                e instanceof N
                  ? P({ baseGrammar: a, selfGrammar: s }, n)
                  : L(
                      e.ruleName,
                      {
                        baseGrammar: a,
                        selfGrammar: s,
                        repository: s.repository,
                      },
                      n,
                    );
                let i = r.injections(e.scopeName);
                if (i) for (let e of i) n.add(new N(e));
              })(r, this.initialScopeName, this.repo, t);
            for (let e of t.references)
              if (e instanceof N) {
                if (this.seenFullScopeRequests.has(e.scopeName)) continue;
                (this.seenFullScopeRequests.add(e.scopeName), this.Q.push(e));
              } else {
                if (
                  this.seenFullScopeRequests.has(e.scopeName) ||
                  this.seenPartialScopeRequests.has(e.toKey())
                )
                  continue;
                (this.seenPartialScopeRequests.add(e.toKey()), this.Q.push(e));
              }
          }
        };
      function L(e, t, r) {
        t.repository && t.repository[e] && R([t.repository[e]], t, r);
      }
      function P(e, t) {
        (e.selfGrammar.patterns &&
          Array.isArray(e.selfGrammar.patterns) &&
          R(
            e.selfGrammar.patterns,
            { ...e, repository: e.selfGrammar.repository },
            t,
          ),
          e.selfGrammar.injections &&
            R(
              Object.values(e.selfGrammar.injections),
              { ...e, repository: e.selfGrammar.repository },
              t,
            ));
      }
      function R(e, t, r) {
        for (let n of e) {
          if (r.visitedRule.has(n)) continue;
          r.visitedRule.add(n);
          let e = n.repository
            ? i({}, t.repository, n.repository)
            : t.repository;
          Array.isArray(n.patterns) &&
            R(n.patterns, { ...t, repository: e }, r);
          let s = n.include;
          if (!s) continue;
          let a = F(s);
          switch (a.kind) {
            case 0:
              P({ ...t, selfGrammar: t.baseGrammar }, r);
              break;
            case 1:
              P(t, r);
              break;
            case 2:
              L(a.ruleName, { ...t, repository: e }, r);
              break;
            case 3:
            case 4:
              let o =
                a.scopeName === t.selfGrammar.scopeName
                  ? t.selfGrammar
                  : a.scopeName === t.baseGrammar.scopeName
                    ? t.baseGrammar
                    : void 0;
              if (o) {
                let n = {
                  baseGrammar: t.baseGrammar,
                  selfGrammar: o,
                  repository: e,
                };
                4 === a.kind ? L(a.ruleName, n, r) : P(n, r);
              } else
                4 === a.kind
                  ? r.add(new E(a.scopeName, a.ruleName))
                  : r.add(new N(a.scopeName));
          }
        }
      }
      var T = class {
          kind = 0;
        },
        M = class {
          kind = 1;
        },
        G = class {
          constructor(e) {
            this.ruleName = e;
          }
          ruleName;
          kind = 2;
        },
        B = class {
          constructor(e) {
            this.scopeName = e;
          }
          scopeName;
          kind = 3;
        },
        O = class {
          constructor(e, t) {
            ((this.scopeName = e), (this.ruleName = t));
          }
          scopeName;
          ruleName;
          kind = 4;
        };
      function F(e) {
        if ("$base" === e) return new T();
        if ("$self" === e) return new M();
        let t = e.indexOf("#");
        return -1 === t
          ? new B(e)
          : 0 === t
            ? new G(e.substring(1))
            : new O(e.substring(0, t), e.substring(t + 1));
      }
      var D = /\\(\d+)/,
        j = /\\(\d+)/g,
        U = class {
          $location;
          id;
          _nameIsCapturing;
          _name;
          _contentNameIsCapturing;
          _contentName;
          constructor(e, t, r, n) {
            ((this.$location = e),
              (this.id = t),
              (this._name = r || null),
              (this._nameIsCapturing = l.hasCaptures(this._name)),
              (this._contentName = n || null),
              (this._contentNameIsCapturing = l.hasCaptures(
                this._contentName,
              )));
          }
          get debugName() {
            let e = this.$location
              ? `${(function e(t) {
                  let r = ~t.lastIndexOf("/") || ~t.lastIndexOf("\\");
                  return 0 === r
                    ? t
                    : ~r == t.length - 1
                      ? e(t.substring(0, t.length - 1))
                      : t.substr(~r + 1);
                })(this.$location.filename)}:${this.$location.line}`
              : "unknown";
            return `${this.constructor.name}#${this.id} @ ${e}`;
          }
          getName(e, t) {
            return this._nameIsCapturing &&
              null !== this._name &&
              null !== e &&
              null !== t
              ? l.replaceCaptures(this._name, e, t)
              : this._name;
          }
          getContentName(e, t) {
            return this._contentNameIsCapturing && null !== this._contentName
              ? l.replaceCaptures(this._contentName, e, t)
              : this._contentName;
          }
        },
        W = class extends U {
          retokenizeCapturedWithRuleId;
          constructor(e, t, r, n, s) {
            (super(e, t, r, n), (this.retokenizeCapturedWithRuleId = s));
          }
          dispose() {}
          collectPatterns(e, t) {
            throw Error("Not supported!");
          }
          compile(e, t) {
            throw Error("Not supported!");
          }
          compileAG(e, t, r, n) {
            throw Error("Not supported!");
          }
        },
        q = class extends U {
          _match;
          captures;
          _cachedCompiledPatterns;
          constructor(e, t, r, n, s) {
            (super(e, t, r, null),
              (this._match = new Q(n, this.id)),
              (this.captures = s),
              (this._cachedCompiledPatterns = null));
          }
          dispose() {
            this._cachedCompiledPatterns &&
              (this._cachedCompiledPatterns.dispose(),
              (this._cachedCompiledPatterns = null));
          }
          get debugMatchRegExp() {
            return `${this._match.source}`;
          }
          collectPatterns(e, t) {
            t.push(this._match);
          }
          compile(e, t) {
            return this._getCachedCompiledPatterns(e).compile(e);
          }
          compileAG(e, t, r, n) {
            return this._getCachedCompiledPatterns(e).compileAG(e, r, n);
          }
          _getCachedCompiledPatterns(e) {
            return (
              this._cachedCompiledPatterns ||
                ((this._cachedCompiledPatterns = new Z()),
                this.collectPatterns(e, this._cachedCompiledPatterns)),
              this._cachedCompiledPatterns
            );
          }
        },
        z = class extends U {
          hasMissingPatterns;
          patterns;
          _cachedCompiledPatterns;
          constructor(e, t, r, n, s) {
            (super(e, t, r, n),
              (this.patterns = s.patterns),
              (this.hasMissingPatterns = s.hasMissingPatterns),
              (this._cachedCompiledPatterns = null));
          }
          dispose() {
            this._cachedCompiledPatterns &&
              (this._cachedCompiledPatterns.dispose(),
              (this._cachedCompiledPatterns = null));
          }
          collectPatterns(e, t) {
            for (let r of this.patterns) e.getRule(r).collectPatterns(e, t);
          }
          compile(e, t) {
            return this._getCachedCompiledPatterns(e).compile(e);
          }
          compileAG(e, t, r, n) {
            return this._getCachedCompiledPatterns(e).compileAG(e, r, n);
          }
          _getCachedCompiledPatterns(e) {
            return (
              this._cachedCompiledPatterns ||
                ((this._cachedCompiledPatterns = new Z()),
                this.collectPatterns(e, this._cachedCompiledPatterns)),
              this._cachedCompiledPatterns
            );
          }
        },
        H = class extends U {
          _begin;
          beginCaptures;
          _end;
          endHasBackReferences;
          endCaptures;
          applyEndPatternLast;
          hasMissingPatterns;
          patterns;
          _cachedCompiledPatterns;
          constructor(e, t, r, n, s, a, i, o, l, c) {
            (super(e, t, r, n),
              (this._begin = new Q(s, this.id)),
              (this.beginCaptures = a),
              (this._end = new Q(i || "￿", -1)),
              (this.endHasBackReferences = this._end.hasBackReferences),
              (this.endCaptures = o),
              (this.applyEndPatternLast = l || !1),
              (this.patterns = c.patterns),
              (this.hasMissingPatterns = c.hasMissingPatterns),
              (this._cachedCompiledPatterns = null));
          }
          dispose() {
            this._cachedCompiledPatterns &&
              (this._cachedCompiledPatterns.dispose(),
              (this._cachedCompiledPatterns = null));
          }
          get debugBeginRegExp() {
            return `${this._begin.source}`;
          }
          get debugEndRegExp() {
            return `${this._end.source}`;
          }
          getEndWithResolvedBackReferences(e, t) {
            return this._end.resolveBackReferences(e, t);
          }
          collectPatterns(e, t) {
            t.push(this._begin);
          }
          compile(e, t) {
            return this._getCachedCompiledPatterns(e, t).compile(e);
          }
          compileAG(e, t, r, n) {
            return this._getCachedCompiledPatterns(e, t).compileAG(e, r, n);
          }
          _getCachedCompiledPatterns(e, t) {
            if (!this._cachedCompiledPatterns) {
              for (let t of ((this._cachedCompiledPatterns = new Z()),
              this.patterns))
                e.getRule(t).collectPatterns(e, this._cachedCompiledPatterns);
              this.applyEndPatternLast
                ? this._cachedCompiledPatterns.push(
                    this._end.hasBackReferences ? this._end.clone() : this._end,
                  )
                : this._cachedCompiledPatterns.unshift(
                    this._end.hasBackReferences ? this._end.clone() : this._end,
                  );
            }
            return (
              this._end.hasBackReferences &&
                (this.applyEndPatternLast
                  ? this._cachedCompiledPatterns.setSource(
                      this._cachedCompiledPatterns.length() - 1,
                      t,
                    )
                  : this._cachedCompiledPatterns.setSource(0, t)),
              this._cachedCompiledPatterns
            );
          }
        },
        V = class extends U {
          _begin;
          beginCaptures;
          whileCaptures;
          _while;
          whileHasBackReferences;
          hasMissingPatterns;
          patterns;
          _cachedCompiledPatterns;
          _cachedCompiledWhilePatterns;
          constructor(e, t, r, n, s, a, i, o, l) {
            (super(e, t, r, n),
              (this._begin = new Q(s, this.id)),
              (this.beginCaptures = a),
              (this.whileCaptures = o),
              (this._while = new Q(i, -2)),
              (this.whileHasBackReferences = this._while.hasBackReferences),
              (this.patterns = l.patterns),
              (this.hasMissingPatterns = l.hasMissingPatterns),
              (this._cachedCompiledPatterns = null),
              (this._cachedCompiledWhilePatterns = null));
          }
          dispose() {
            (this._cachedCompiledPatterns &&
              (this._cachedCompiledPatterns.dispose(),
              (this._cachedCompiledPatterns = null)),
              this._cachedCompiledWhilePatterns &&
                (this._cachedCompiledWhilePatterns.dispose(),
                (this._cachedCompiledWhilePatterns = null)));
          }
          get debugBeginRegExp() {
            return `${this._begin.source}`;
          }
          get debugWhileRegExp() {
            return `${this._while.source}`;
          }
          getWhileWithResolvedBackReferences(e, t) {
            return this._while.resolveBackReferences(e, t);
          }
          collectPatterns(e, t) {
            t.push(this._begin);
          }
          compile(e, t) {
            return this._getCachedCompiledPatterns(e).compile(e);
          }
          compileAG(e, t, r, n) {
            return this._getCachedCompiledPatterns(e).compileAG(e, r, n);
          }
          _getCachedCompiledPatterns(e) {
            if (!this._cachedCompiledPatterns)
              for (let t of ((this._cachedCompiledPatterns = new Z()),
              this.patterns))
                e.getRule(t).collectPatterns(e, this._cachedCompiledPatterns);
            return this._cachedCompiledPatterns;
          }
          compileWhile(e, t) {
            return this._getCachedCompiledWhilePatterns(e, t).compile(e);
          }
          compileWhileAG(e, t, r, n) {
            return this._getCachedCompiledWhilePatterns(e, t).compileAG(
              e,
              r,
              n,
            );
          }
          _getCachedCompiledWhilePatterns(e, t) {
            return (
              this._cachedCompiledWhilePatterns ||
                ((this._cachedCompiledWhilePatterns = new Z()),
                this._cachedCompiledWhilePatterns.push(
                  this._while.hasBackReferences
                    ? this._while.clone()
                    : this._while,
                )),
              this._while.hasBackReferences &&
                this._cachedCompiledWhilePatterns.setSource(0, t || "￿"),
              this._cachedCompiledWhilePatterns
            );
          }
        },
        X = class e {
          static createCaptureRule(e, t, r, n, s) {
            return e.registerRule((e) => new W(t, e, r, n, s));
          }
          static getCompiledRuleId(t, r, n) {
            return (
              t.id ||
                r.registerRule((s) => {
                  if (((t.id = s), t.match))
                    return new q(
                      t.$vscodeTextmateLocation,
                      t.id,
                      t.name,
                      t.match,
                      e._compileCaptures(t.captures, r, n),
                    );
                  if (void 0 === t.begin) {
                    t.repository && (n = i({}, n, t.repository));
                    let s = t.patterns;
                    return (
                      void 0 === s &&
                        t.include &&
                        (s = [{ include: t.include }]),
                      new z(
                        t.$vscodeTextmateLocation,
                        t.id,
                        t.name,
                        t.contentName,
                        e._compilePatterns(s, r, n),
                      )
                    );
                  }
                  return t.while
                    ? new V(
                        t.$vscodeTextmateLocation,
                        t.id,
                        t.name,
                        t.contentName,
                        t.begin,
                        e._compileCaptures(t.beginCaptures || t.captures, r, n),
                        t.while,
                        e._compileCaptures(t.whileCaptures || t.captures, r, n),
                        e._compilePatterns(t.patterns, r, n),
                      )
                    : new H(
                        t.$vscodeTextmateLocation,
                        t.id,
                        t.name,
                        t.contentName,
                        t.begin,
                        e._compileCaptures(t.beginCaptures || t.captures, r, n),
                        t.end,
                        e._compileCaptures(t.endCaptures || t.captures, r, n),
                        t.applyEndPatternLast,
                        e._compilePatterns(t.patterns, r, n),
                      );
                }),
              t.id
            );
          }
          static _compileCaptures(t, r, n) {
            let s = [];
            if (t) {
              let a = 0;
              for (let e in t) {
                if ("$vscodeTextmateLocation" === e) continue;
                let t = parseInt(e, 10);
                t > a && (a = t);
              }
              for (let e = 0; e <= a; e++) s[e] = null;
              for (let a in t) {
                if ("$vscodeTextmateLocation" === a) continue;
                let i = parseInt(a, 10),
                  o = 0;
                (t[a].patterns && (o = e.getCompiledRuleId(t[a], r, n)),
                  (s[i] = e.createCaptureRule(
                    r,
                    t[a].$vscodeTextmateLocation,
                    t[a].name,
                    t[a].contentName,
                    o,
                  )));
              }
            }
            return s;
          }
          static _compilePatterns(t, r, n) {
            let s = [];
            if (t)
              for (let a = 0, i = t.length; a < i; a++) {
                let i = t[a],
                  o = -1;
                if (i.include) {
                  let t = F(i.include);
                  switch (t.kind) {
                    case 0:
                    case 1:
                      o = e.getCompiledRuleId(n[i.include], r, n);
                      break;
                    case 2:
                      let s = n[t.ruleName];
                      s && (o = e.getCompiledRuleId(s, r, n));
                      break;
                    case 3:
                    case 4:
                      let a = t.scopeName,
                        l = 4 === t.kind ? t.ruleName : null,
                        c = r.getExternalGrammar(a, n);
                      if (c)
                        if (l) {
                          let t = c.repository[l];
                          t && (o = e.getCompiledRuleId(t, r, c.repository));
                        } else
                          o = e.getCompiledRuleId(
                            c.repository.$self,
                            r,
                            c.repository,
                          );
                  }
                } else o = e.getCompiledRuleId(i, r, n);
                if (-1 !== o) {
                  let e = r.getRule(o),
                    t = !1;
                  if (
                    ((e instanceof z || e instanceof H || e instanceof V) &&
                      e.hasMissingPatterns &&
                      0 === e.patterns.length &&
                      (t = !0),
                    t)
                  )
                    continue;
                  s.push(o);
                }
              }
            return {
              patterns: s,
              hasMissingPatterns: (t ? t.length : 0) !== s.length,
            };
          }
        },
        Q = class e {
          source;
          ruleId;
          hasAnchor;
          hasBackReferences;
          _anchorCache;
          constructor(e, t) {
            if (e && "string" == typeof e) {
              let t = e.length,
                r = 0,
                n = [],
                s = !1;
              for (let a = 0; a < t; a++)
                if ("\\" === e.charAt(a) && a + 1 < t) {
                  let t = e.charAt(a + 1);
                  ("z" === t
                    ? (n.push(e.substring(r, a)),
                      n.push("$(?!\\n)(?<!\\n)"),
                      (r = a + 2))
                    : ("A" === t || "G" === t) && (s = !0),
                    a++);
                }
              ((this.hasAnchor = s),
                0 === r
                  ? (this.source = e)
                  : (n.push(e.substring(r, t)), (this.source = n.join(""))));
            } else ((this.hasAnchor = !1), (this.source = e));
            (this.hasAnchor
              ? (this._anchorCache = this._buildAnchorCache())
              : (this._anchorCache = null),
              (this.ruleId = t),
              "string" == typeof this.source
                ? (this.hasBackReferences = D.test(this.source))
                : (this.hasBackReferences = !1));
          }
          clone() {
            return new e(this.source, this.ruleId);
          }
          setSource(e) {
            this.source !== e &&
              ((this.source = e),
              this.hasAnchor && (this._anchorCache = this._buildAnchorCache()));
          }
          resolveBackReferences(e, t) {
            if ("string" != typeof this.source)
              throw Error(
                "This method should only be called if the source is a string",
              );
            let r = t.map((t) => e.substring(t.start, t.end));
            return (
              (j.lastIndex = 0),
              this.source.replace(j, (e, t) => h(r[parseInt(t, 10)] || ""))
            );
          }
          _buildAnchorCache() {
            let e, t, r, n;
            if ("string" != typeof this.source)
              throw Error(
                "This method should only be called if the source is a string",
              );
            let s = [],
              a = [],
              i = [],
              o = [];
            for (e = 0, t = this.source.length; e < t; e++)
              ((r = this.source.charAt(e)),
                (s[e] = r),
                (a[e] = r),
                (i[e] = r),
                (o[e] = r),
                "\\" === r &&
                  e + 1 < t &&
                  ("A" === (n = this.source.charAt(e + 1))
                    ? ((s[e + 1] = "￿"),
                      (a[e + 1] = "￿"),
                      (i[e + 1] = "A"),
                      (o[e + 1] = "A"))
                    : "G" === n
                      ? ((s[e + 1] = "￿"),
                        (a[e + 1] = "G"),
                        (i[e + 1] = "￿"),
                        (o[e + 1] = "G"))
                      : ((s[e + 1] = n),
                        (a[e + 1] = n),
                        (i[e + 1] = n),
                        (o[e + 1] = n)),
                  e++));
            return {
              A0_G0: s.join(""),
              A0_G1: a.join(""),
              A1_G0: i.join(""),
              A1_G1: o.join(""),
            };
          }
          resolveAnchors(e, t) {
            if (
              !this.hasAnchor ||
              !this._anchorCache ||
              "string" != typeof this.source
            )
              return this.source;
            if (e)
              if (t) return this._anchorCache.A1_G1;
              else return this._anchorCache.A1_G0;
            return t ? this._anchorCache.A0_G1 : this._anchorCache.A0_G0;
          }
        },
        Z = class {
          _items;
          _hasAnchors;
          _cached;
          _anchorCache;
          constructor() {
            ((this._items = []),
              (this._hasAnchors = !1),
              (this._cached = null),
              (this._anchorCache = {
                A0_G0: null,
                A0_G1: null,
                A1_G0: null,
                A1_G1: null,
              }));
          }
          dispose() {
            this._disposeCaches();
          }
          _disposeCaches() {
            (this._cached && (this._cached.dispose(), (this._cached = null)),
              this._anchorCache.A0_G0 &&
                (this._anchorCache.A0_G0.dispose(),
                (this._anchorCache.A0_G0 = null)),
              this._anchorCache.A0_G1 &&
                (this._anchorCache.A0_G1.dispose(),
                (this._anchorCache.A0_G1 = null)),
              this._anchorCache.A1_G0 &&
                (this._anchorCache.A1_G0.dispose(),
                (this._anchorCache.A1_G0 = null)),
              this._anchorCache.A1_G1 &&
                (this._anchorCache.A1_G1.dispose(),
                (this._anchorCache.A1_G1 = null)));
          }
          push(e) {
            (this._items.push(e),
              (this._hasAnchors = this._hasAnchors || e.hasAnchor));
          }
          unshift(e) {
            (this._items.unshift(e),
              (this._hasAnchors = this._hasAnchors || e.hasAnchor));
          }
          length() {
            return this._items.length;
          }
          setSource(e, t) {
            this._items[e].source !== t &&
              (this._disposeCaches(), this._items[e].setSource(t));
          }
          compile(e) {
            if (!this._cached) {
              let t = this._items.map((e) => e.source);
              this._cached = new K(
                e,
                t,
                this._items.map((e) => e.ruleId),
              );
            }
            return this._cached;
          }
          compileAG(e, t, r) {
            if (!this._hasAnchors) return this.compile(e);
            if (t)
              if (r)
                return (
                  this._anchorCache.A1_G1 ||
                    (this._anchorCache.A1_G1 = this._resolveAnchors(e, t, r)),
                  this._anchorCache.A1_G1
                );
              else
                return (
                  this._anchorCache.A1_G0 ||
                    (this._anchorCache.A1_G0 = this._resolveAnchors(e, t, r)),
                  this._anchorCache.A1_G0
                );
            return r
              ? (this._anchorCache.A0_G1 ||
                  (this._anchorCache.A0_G1 = this._resolveAnchors(e, t, r)),
                this._anchorCache.A0_G1)
              : (this._anchorCache.A0_G0 ||
                  (this._anchorCache.A0_G0 = this._resolveAnchors(e, t, r)),
                this._anchorCache.A0_G0);
          }
          _resolveAnchors(e, t, r) {
            return new K(
              e,
              this._items.map((e) => e.resolveAnchors(t, r)),
              this._items.map((e) => e.ruleId),
            );
          }
        },
        K = class {
          constructor(e, t, r) {
            ((this.regExps = t),
              (this.rules = r),
              (this.scanner = e.createOnigScanner(t)));
          }
          regExps;
          rules;
          scanner;
          dispose() {
            "function" == typeof this.scanner.dispose && this.scanner.dispose();
          }
          toString() {
            let e = [];
            for (let t = 0, r = this.rules.length; t < r; t++)
              e.push("   - " + this.rules[t] + ": " + this.regExps[t]);
            return e.join("\n");
          }
          findNextMatchSync(e, t, r) {
            let n = this.scanner.findNextMatchSync(e, t, r);
            return n
              ? {
                  ruleId: this.rules[n.index],
                  captureIndices: n.captureIndices,
                }
              : null;
          }
        },
        Y = class {
          constructor(e, t) {
            ((this.languageId = e), (this.tokenType = t));
          }
          languageId;
          tokenType;
        },
        J = class e {
          _defaultAttributes;
          _embeddedLanguagesMatcher;
          constructor(e, t) {
            ((this._defaultAttributes = new Y(e, 8)),
              (this._embeddedLanguagesMatcher = new ee(
                Object.entries(t || {}),
              )));
          }
          getDefaultAttributes() {
            return this._defaultAttributes;
          }
          getBasicScopeAttributes(t) {
            return null === t
              ? e._NULL_SCOPE_METADATA
              : this._getBasicScopeAttributes.get(t);
          }
          static _NULL_SCOPE_METADATA = new Y(0, 0);
          _getBasicScopeAttributes = new p(
            (e) =>
              new Y(this._scopeToLanguage(e), this._toStandardTokenType(e)),
          );
          _scopeToLanguage(e) {
            return this._embeddedLanguagesMatcher.match(e) || 0;
          }
          _toStandardTokenType(t) {
            let r = t.match(e.STANDARD_TOKEN_TYPE_REGEXP);
            if (!r) return 8;
            switch (r[1]) {
              case "comment":
                return 1;
              case "string":
                return 2;
              case "regex":
                return 3;
              case "meta.embedded":
                return 0;
            }
            throw Error("Unexpected match for standard token type!");
          }
          static STANDARD_TOKEN_TYPE_REGEXP =
            /\b(comment|string|regex|meta\.embedded)\b/;
        },
        ee = class {
          values;
          scopesRegExp;
          constructor(e) {
            if (0 === e.length)
              ((this.values = null), (this.scopesRegExp = null));
            else {
              this.values = new Map(e);
              let t = e.map(([e, t]) => h(e));
              (t.sort(),
                t.reverse(),
                (this.scopesRegExp = RegExp(
                  `^((${t.join(")|(")}))($|\\.)`,
                  "",
                )));
            }
          }
          match(e) {
            if (!this.scopesRegExp) return;
            let t = e.match(this.scopesRegExp);
            if (t) return this.values.get(t[1]);
          }
        };
      void 0 !== a.default && a.default.env.VSCODE_TEXTMATE_DEBUG;
      var et = class {
        constructor(e, t) {
          ((this.stack = e), (this.stoppedEarly = t));
        }
        stack;
        stoppedEarly;
      };
      function er(e, t, r, n, s, a, i, o) {
        let l = t.content.length,
          c = !1,
          u = -1;
        if (i) {
          let i = (function (e, t, r, n, s, a) {
            let i = s.beginRuleCapturedEOL ? 0 : -1,
              o = [];
            for (let t = s; t; t = t.pop()) {
              let r = t.getRule(e);
              r instanceof V && o.push({ rule: r, stack: t });
            }
            for (let d = o.pop(); d; d = o.pop()) {
              var l, c, u, h, p;
              let { ruleScanner: o, findOptions: g } =
                  ((l = d.rule),
                  (c = e),
                  (u = d.stack.endRule),
                  (h = r),
                  (p = n === i),
                  {
                    ruleScanner: l.compileWhileAG(c, u, h, p),
                    findOptions: 0,
                  }),
                f = o.findNextMatchSync(t, n, g);
              if (f) {
                if (-2 !== f.ruleId) {
                  s = d.stack.pop();
                  break;
                }
                f.captureIndices &&
                  f.captureIndices.length &&
                  (a.produce(d.stack, f.captureIndices[0].start),
                  es(
                    e,
                    t,
                    r,
                    d.stack,
                    a,
                    d.rule.whileCaptures,
                    f.captureIndices,
                  ),
                  a.produce(d.stack, f.captureIndices[0].end),
                  (i = f.captureIndices[0].end),
                  f.captureIndices[0].end > n &&
                    ((n = f.captureIndices[0].end), (r = !1)));
              } else {
                s = d.stack.pop();
                break;
              }
            }
            return { stack: s, linePos: n, anchorPosition: i, isFirstLine: r };
          })(e, t, r, n, s, a);
          ((s = i.stack),
            (n = i.linePos),
            (r = i.isFirstLine),
            (u = i.anchorPosition));
        }
        let h = Date.now();
        for (; !c;) {
          if (0 !== o && Date.now() - h > o) return new et(s, !0);
          !(function () {
            let i = (function (e, t, r, n, s, a) {
              let i = (function (e, t, r, n, s, a) {
                  let { ruleScanner: i, findOptions: o } = en(
                      s.getRule(e),
                      e,
                      s.endRule,
                      r,
                      n === a,
                    ),
                    l = i.findNextMatchSync(t, n, o);
                  return l
                    ? {
                        captureIndices: l.captureIndices,
                        matchedRuleId: l.ruleId,
                      }
                    : null;
                })(e, t, r, n, s, a),
                o = e.getInjections();
              if (0 === o.length) return i;
              let l = (function (e, t, r, n, s, a, i) {
                let o,
                  l = Number.MAX_VALUE,
                  c = null,
                  u = 0,
                  h = a.contentNameScopesList.getScopeNames();
                for (let a = 0, p = e.length; a < p; a++) {
                  let p = e[a];
                  if (!p.matcher(h)) continue;
                  let { ruleScanner: d, findOptions: g } = en(
                      t.getRule(p.ruleId),
                      t,
                      null,
                      n,
                      s === i,
                    ),
                    f = d.findNextMatchSync(r, s, g);
                  if (!f) continue;
                  let m = f.captureIndices[0].start;
                  if (
                    !(m >= l) &&
                    ((l = m),
                    (c = f.captureIndices),
                    (o = f.ruleId),
                    (u = p.priority),
                    l === s)
                  )
                    break;
                }
                return c
                  ? {
                      priorityMatch: -1 === u,
                      captureIndices: c,
                      matchedRuleId: o,
                    }
                  : null;
              })(o, e, t, r, n, s, a);
              if (!l) return i;
              if (!i) return l;
              let c = i.captureIndices[0].start,
                u = l.captureIndices[0].start;
              return u < c || (l.priorityMatch && u === c) ? l : i;
            })(e, t, r, n, s, u);
            if (!i) {
              (a.produce(s, l), (c = !0));
              return;
            }
            let o = i.captureIndices,
              h = i.matchedRuleId,
              p = !!o && o.length > 0 && o[0].end > n;
            if (-1 === h) {
              let i = s.getRule(e);
              (a.produce(s, o[0].start),
                (s = s.withContentNameScopesList(s.nameScopesList)),
                es(e, t, r, s, a, i.endCaptures, o),
                a.produce(s, o[0].end));
              let h = s;
              if (
                ((s = s.parent),
                (u = h.getAnchorPos()),
                !p && h.getEnterPos() === n)
              ) {
                ((s = h), a.produce(s, l), (c = !0));
                return;
              }
            } else {
              let i = e.getRule(h);
              a.produce(s, o[0].start);
              let d = s,
                g = i.getName(t.content, o),
                f = s.contentNameScopesList.pushAttributed(g, e);
              if (
                ((s = s.push(h, n, u, o[0].end === l, null, f, f)),
                i instanceof H)
              ) {
                (es(e, t, r, s, a, i.beginCaptures, o),
                  a.produce(s, o[0].end),
                  (u = o[0].end));
                let n = i.getContentName(t.content, o),
                  h = f.pushAttributed(n, e);
                if (
                  ((s = s.withContentNameScopesList(h)),
                  i.endHasBackReferences &&
                    (s = s.withEndRule(
                      i.getEndWithResolvedBackReferences(t.content, o),
                    )),
                  !p && d.hasSameRuleAs(s))
                ) {
                  ((s = s.pop()), a.produce(s, l), (c = !0));
                  return;
                }
              } else if (i instanceof V) {
                (es(e, t, r, s, a, i.beginCaptures, o),
                  a.produce(s, o[0].end),
                  (u = o[0].end));
                let n = i.getContentName(t.content, o),
                  h = f.pushAttributed(n, e);
                if (
                  ((s = s.withContentNameScopesList(h)),
                  i.whileHasBackReferences &&
                    (s = s.withEndRule(
                      i.getWhileWithResolvedBackReferences(t.content, o),
                    )),
                  !p && d.hasSameRuleAs(s))
                ) {
                  ((s = s.pop()), a.produce(s, l), (c = !0));
                  return;
                }
              } else if (
                (es(e, t, r, s, a, i.captures, o),
                a.produce(s, o[0].end),
                (s = s.pop()),
                !p)
              ) {
                ((s = s.safePop()), a.produce(s, l), (c = !0));
                return;
              }
            }
            o[0].end > n && ((n = o[0].end), (r = !1));
          })();
        }
        return new et(s, !1);
      }
      function en(e, t, r, n, s) {
        return { ruleScanner: e.compileAG(t, r, n, s), findOptions: 0 };
      }
      function es(e, t, r, n, s, a, i) {
        if (0 === a.length) return;
        let o = t.content,
          l = Math.min(a.length, i.length),
          c = [],
          u = i[0].end;
        for (let t = 0; t < l; t++) {
          let l = a[t];
          if (null === l) continue;
          let h = i[t];
          if (0 === h.length) continue;
          if (h.start > u) break;
          for (; c.length > 0 && c[c.length - 1].endPos <= h.start;)
            (s.produceFromScopes(
              c[c.length - 1].scopes,
              c[c.length - 1].endPos,
            ),
              c.pop());
          if (
            (c.length > 0
              ? s.produceFromScopes(c[c.length - 1].scopes, h.start)
              : s.produce(n, h.start),
            l.retokenizeCapturedWithRuleId)
          ) {
            let t = l.getName(o, i),
              a = n.contentNameScopesList.pushAttributed(t, e),
              c = l.getContentName(o, i),
              u = a.pushAttributed(c, e),
              p = n.push(
                l.retokenizeCapturedWithRuleId,
                h.start,
                -1,
                !1,
                null,
                a,
                u,
              ),
              d = e.createOnigString(o.substring(0, h.end));
            (er(e, d, r && 0 === h.start, h.start, p, s, !1, 0), A(d));
            continue;
          }
          let p = l.getName(o, i);
          if (null !== p) {
            let t = (
              c.length > 0 ? c[c.length - 1].scopes : n.contentNameScopesList
            ).pushAttributed(p, e);
            c.push(new ea(t, h.end));
          }
        }
        for (; c.length > 0;)
          (s.produceFromScopes(c[c.length - 1].scopes, c[c.length - 1].endPos),
            c.pop());
      }
      var ea = class {
        scopes;
        endPos;
        constructor(e, t) {
          ((this.scopes = e), (this.endPos = t));
        }
      };
      function ei(e, t, r, n, s) {
        let a = S(t, eo),
          i = X.getCompiledRuleId(r, n, s.repository);
        for (let r of a)
          e.push({
            debugSelector: t,
            matcher: r.matcher,
            ruleId: i,
            grammar: s,
            priority: r.priority,
          });
      }
      function eo(e, t) {
        if (t.length < e.length) return !1;
        let r = 0;
        return e.every((e) => {
          for (let n = r; n < t.length; n++)
            if (
              (function (e, t) {
                if (!e) return !1;
                if (e === t) return !0;
                let r = t.length;
                return e.length > r && e.substr(0, r) === t && "." === e[r];
              })(t[n], e)
            )
              return ((r = n + 1), !0);
          return !1;
        });
      }
      var el = class {
        constructor(e, t, r, n, s, a, i, o) {
          if (
            ((this._rootScopeName = e),
            (this.balancedBracketSelectors = a),
            (this._onigLib = o),
            (this._basicScopeAttributesProvider = new J(r, n)),
            (this._rootId = -1),
            (this._lastRuleId = 0),
            (this._ruleId2desc = [null]),
            (this._includedGrammars = {}),
            (this._grammarRepository = i),
            (this._grammar = ec(t, null)),
            (this._injections = null),
            (this._tokenTypeMatchers = []),
            s)
          )
            for (let e of Object.keys(s))
              for (let t of S(e, eo))
                this._tokenTypeMatchers.push({
                  matcher: t.matcher,
                  type: s[e],
                });
        }
        _rootScopeName;
        balancedBracketSelectors;
        _onigLib;
        _rootId;
        _lastRuleId;
        _ruleId2desc;
        _includedGrammars;
        _grammarRepository;
        _grammar;
        _injections;
        _basicScopeAttributesProvider;
        _tokenTypeMatchers;
        get themeProvider() {
          return this._grammarRepository;
        }
        dispose() {
          for (let e of this._ruleId2desc) e && e.dispose();
        }
        createOnigScanner(e) {
          return this._onigLib.createOnigScanner(e);
        }
        createOnigString(e) {
          return this._onigLib.createOnigString(e);
        }
        getMetadataForScope(e) {
          return this._basicScopeAttributesProvider.getBasicScopeAttributes(e);
        }
        _collectInjections() {
          let e = [],
            t = this._rootScopeName,
            r = {
              lookup: (e) =>
                e === this._rootScopeName
                  ? this._grammar
                  : this.getExternalGrammar(e),
              injections: (e) => this._grammarRepository.injections(e),
            }.lookup(t);
          if (r) {
            let n = r.injections;
            if (n) for (let t in n) ei(e, t, n[t], this, r);
            let s = this._grammarRepository.injections(t);
            s &&
              s.forEach((t) => {
                let r = this.getExternalGrammar(t);
                if (r) {
                  let t = r.injectionSelector;
                  t && ei(e, t, r, this, r);
                }
              });
          }
          return (e.sort((e, t) => e.priority - t.priority), e);
        }
        getInjections() {
          return (
            null === this._injections &&
              (this._injections = this._collectInjections()),
            this._injections
          );
        }
        registerRule(e) {
          let t = ++this._lastRuleId,
            r = e(t);
          return ((this._ruleId2desc[t] = r), r);
        }
        getRule(e) {
          return this._ruleId2desc[e];
        }
        getExternalGrammar(e, t) {
          if (this._includedGrammars[e]) return this._includedGrammars[e];
          if (this._grammarRepository) {
            let r = this._grammarRepository.lookup(e);
            if (r)
              return (
                (this._includedGrammars[e] = ec(r, t && t.$base)),
                this._includedGrammars[e]
              );
          }
        }
        tokenizeLine(e, t, r = 0) {
          let n = this._tokenize(e, t, !1, r);
          return {
            tokens: n.lineTokens.getResult(n.ruleStack, n.lineLength),
            ruleStack: n.ruleStack,
            stoppedEarly: n.stoppedEarly,
          };
        }
        tokenizeLine2(e, t, r = 0) {
          let n = this._tokenize(e, t, !0, r);
          return {
            tokens: n.lineTokens.getBinaryResult(n.ruleStack, n.lineLength),
            ruleStack: n.ruleStack,
            stoppedEarly: n.stoppedEarly,
          };
        }
        _tokenize(e, t, r, n) {
          let s;
          if (
            (-1 === this._rootId &&
              ((this._rootId = X.getCompiledRuleId(
                this._grammar.repository.$self,
                this,
                this._grammar.repository,
              )),
              this.getInjections()),
            t && t !== eh.NULL)
          )
            ((s = !1), t.reset());
          else {
            let e;
            s = !0;
            let r = this._basicScopeAttributesProvider.getDefaultAttributes(),
              n = this.themeProvider.getDefaults(),
              a = C.set(
                0,
                r.languageId,
                r.tokenType,
                null,
                n.fontStyle,
                n.foregroundId,
                n.backgroundId,
              ),
              i = this.getRule(this._rootId).getName(null, null);
            ((e = i
              ? eu.createRootAndLookUpScopeName(i, a, this)
              : eu.createRoot("unknown", a)),
              (t = new eh(null, this._rootId, -1, -1, !1, null, e, e)));
          }
          e += "\n";
          let a = this.createOnigString(e),
            i = a.content.length,
            o = new ed(
              r,
              e,
              this._tokenTypeMatchers,
              this.balancedBracketSelectors,
            ),
            l = er(this, a, s, 0, t, o, !0, n);
          return (
            A(a),
            {
              lineLength: i,
              lineTokens: o,
              ruleStack: l.stack,
              stoppedEarly: l.stoppedEarly,
            }
          );
        }
      };
      function ec(e, t) {
        return (
          ((e = (function e(t) {
            return Array.isArray(t)
              ? (function (t) {
                  let r = [];
                  for (let n = 0, s = t.length; n < s; n++) r[n] = e(t[n]);
                  return r;
                })(t)
              : t instanceof RegExp
                ? t
                : "object" == typeof t
                  ? (function (t) {
                      let r = {};
                      for (let n in t) r[n] = e(t[n]);
                      return r;
                    })(t)
                  : t;
          })(e)).repository = e.repository || {}),
          (e.repository.$self = {
            $vscodeTextmateLocation: e.$vscodeTextmateLocation,
            patterns: e.patterns,
            name: e.scopeName,
          }),
          (e.repository.$base = t || e.repository.$self),
          e
        );
      }
      var eu = class e {
          constructor(e, t, r) {
            ((this.parent = e),
              (this.scopePath = t),
              (this.tokenAttributes = r));
          }
          parent;
          scopePath;
          tokenAttributes;
          static fromExtension(t, r) {
            let n = t,
              s = t?.scopePath ?? null;
            for (let t of r)
              n = new e(
                n,
                (s = g.push(s, t.scopeNames)),
                t.encodedTokenAttributes,
              );
            return n;
          }
          static createRoot(t, r) {
            return new e(null, new g(null, t), r);
          }
          static createRootAndLookUpScopeName(t, r, n) {
            let s = n.getMetadataForScope(t),
              a = new g(null, t),
              i = n.themeProvider.themeMatch(a),
              o = e.mergeAttributes(r, s, i);
            return new e(null, a, o);
          }
          get scopeName() {
            return this.scopePath.scopeName;
          }
          toString() {
            return this.getScopeNames().join(" ");
          }
          equals(t) {
            return e.equals(this, t);
          }
          static equals(e, t) {
            for (;;) {
              if (e === t || (!e && !t)) return !0;
              if (
                !e ||
                !t ||
                e.scopeName !== t.scopeName ||
                e.tokenAttributes !== t.tokenAttributes
              )
                return !1;
              ((e = e.parent), (t = t.parent));
            }
          }
          static mergeAttributes(e, t, r) {
            let n = -1,
              s = 0,
              a = 0;
            return (
              null !== r &&
                ((n = r.fontStyle), (s = r.foregroundId), (a = r.backgroundId)),
              C.set(e, t.languageId, t.tokenType, null, n, s, a)
            );
          }
          pushAttributed(t, r) {
            if (null === t) return this;
            if (-1 === t.indexOf(" ")) return e._pushAttributed(this, t, r);
            let n = t.split(/ /g),
              s = this;
            for (let t of n) s = e._pushAttributed(s, t, r);
            return s;
          }
          static _pushAttributed(t, r, n) {
            let s = n.getMetadataForScope(r),
              a = t.scopePath.push(r),
              i = n.themeProvider.themeMatch(a),
              o = e.mergeAttributes(t.tokenAttributes, s, i);
            return new e(t, a, o);
          }
          getScopeNames() {
            return this.scopePath.getSegments();
          }
          getExtensionIfDefined(e) {
            let t = [],
              r = this;
            for (; r && r !== e;)
              (t.push({
                encodedTokenAttributes: r.tokenAttributes,
                scopeNames: r.scopePath.getExtensionIfDefined(
                  r.parent?.scopePath ?? null,
                ),
              }),
                (r = r.parent));
            return r === e ? t.reverse() : void 0;
          }
        },
        eh = class e {
          constructor(e, t, r, n, s, a, i, o) {
            ((this.parent = e),
              (this.ruleId = t),
              (this.beginRuleCapturedEOL = s),
              (this.endRule = a),
              (this.nameScopesList = i),
              (this.contentNameScopesList = o),
              (this.depth = this.parent ? this.parent.depth + 1 : 1),
              (this._enterPos = r),
              (this._anchorPos = n));
          }
          parent;
          ruleId;
          beginRuleCapturedEOL;
          endRule;
          nameScopesList;
          contentNameScopesList;
          _stackElementBrand = void 0;
          static NULL = new e(null, 0, 0, 0, !1, null, null, null);
          _enterPos;
          _anchorPos;
          depth;
          equals(t) {
            return null !== t && e._equals(this, t);
          }
          static _equals(e, t) {
            return (
              e === t ||
              (!!this._structuralEquals(e, t) &&
                eu.equals(e.contentNameScopesList, t.contentNameScopesList))
            );
          }
          static _structuralEquals(e, t) {
            for (;;) {
              if (e === t || (!e && !t)) return !0;
              if (
                !e ||
                !t ||
                e.depth !== t.depth ||
                e.ruleId !== t.ruleId ||
                e.endRule !== t.endRule
              )
                return !1;
              ((e = e.parent), (t = t.parent));
            }
          }
          clone() {
            return this;
          }
          static _reset(e) {
            for (; e;)
              ((e._enterPos = -1), (e._anchorPos = -1), (e = e.parent));
          }
          reset() {
            e._reset(this);
          }
          pop() {
            return this.parent;
          }
          safePop() {
            return this.parent ? this.parent : this;
          }
          push(t, r, n, s, a, i, o) {
            return new e(this, t, r, n, s, a, i, o);
          }
          getEnterPos() {
            return this._enterPos;
          }
          getAnchorPos() {
            return this._anchorPos;
          }
          getRule(e) {
            return e.getRule(this.ruleId);
          }
          toString() {
            let e = [];
            return (this._writeString(e, 0), "[" + e.join(",") + "]");
          }
          _writeString(e, t) {
            return (
              this.parent && (t = this.parent._writeString(e, t)),
              (e[t++] =
                `(${this.ruleId}, ${this.nameScopesList?.toString()}, ${this.contentNameScopesList?.toString()})`),
              t
            );
          }
          withContentNameScopesList(e) {
            return this.contentNameScopesList === e
              ? this
              : this.parent.push(
                  this.ruleId,
                  this._enterPos,
                  this._anchorPos,
                  this.beginRuleCapturedEOL,
                  this.endRule,
                  this.nameScopesList,
                  e,
                );
          }
          withEndRule(t) {
            return this.endRule === t
              ? this
              : new e(
                  this.parent,
                  this.ruleId,
                  this._enterPos,
                  this._anchorPos,
                  this.beginRuleCapturedEOL,
                  t,
                  this.nameScopesList,
                  this.contentNameScopesList,
                );
          }
          hasSameRuleAs(e) {
            let t = this;
            for (; t && t._enterPos === e._enterPos;) {
              if (t.ruleId === e.ruleId) return !0;
              t = t.parent;
            }
            return !1;
          }
          toStateStackFrame() {
            return {
              ruleId: this.ruleId,
              beginRuleCapturedEOL: this.beginRuleCapturedEOL,
              endRule: this.endRule,
              nameScopesList:
                this.nameScopesList?.getExtensionIfDefined(
                  this.parent?.nameScopesList ?? null,
                ) ?? [],
              contentNameScopesList:
                this.contentNameScopesList?.getExtensionIfDefined(
                  this.nameScopesList,
                ) ?? [],
            };
          }
          static pushFrame(t, r) {
            let n = eu.fromExtension(
              t?.nameScopesList ?? null,
              r.nameScopesList,
            );
            return new e(
              t,
              r.ruleId,
              r.enterPos ?? -1,
              r.anchorPos ?? -1,
              r.beginRuleCapturedEOL,
              r.endRule,
              n,
              eu.fromExtension(n, r.contentNameScopesList),
            );
          }
        },
        ep = class {
          balancedBracketScopes;
          unbalancedBracketScopes;
          allowAny = !1;
          constructor(e, t) {
            ((this.balancedBracketScopes = e.flatMap((e) =>
              "*" === e
                ? ((this.allowAny = !0), [])
                : S(e, eo).map((e) => e.matcher),
            )),
              (this.unbalancedBracketScopes = t.flatMap((e) =>
                S(e, eo).map((e) => e.matcher),
              )));
          }
          get matchesAlways() {
            return this.allowAny && 0 === this.unbalancedBracketScopes.length;
          }
          get matchesNever() {
            return 0 === this.balancedBracketScopes.length && !this.allowAny;
          }
          match(e) {
            for (let t of this.unbalancedBracketScopes) if (t(e)) return !1;
            for (let t of this.balancedBracketScopes) if (t(e)) return !0;
            return this.allowAny;
          }
        },
        ed = class {
          constructor(e, t, r, n) {
            ((this.balancedBracketSelectors = n),
              (this._emitBinaryTokens = e),
              (this._tokenTypeOverrides = r),
              (this._lineText = null),
              (this._tokens = []),
              (this._binaryTokens = []),
              (this._lastTokenEndIndex = 0));
          }
          balancedBracketSelectors;
          _emitBinaryTokens;
          _lineText;
          _tokens;
          _binaryTokens;
          _lastTokenEndIndex;
          _tokenTypeOverrides;
          produce(e, t) {
            this.produceFromScopes(e.contentNameScopesList, t);
          }
          produceFromScopes(e, t) {
            if (this._lastTokenEndIndex >= t) return;
            if (this._emitBinaryTokens) {
              let r = e?.tokenAttributes ?? 0,
                n = !1;
              if (
                (this.balancedBracketSelectors?.matchesAlways && (n = !0),
                this._tokenTypeOverrides.length > 0 ||
                  (this.balancedBracketSelectors &&
                    !this.balancedBracketSelectors.matchesAlways &&
                    !this.balancedBracketSelectors.matchesNever))
              ) {
                let t = e?.getScopeNames() ?? [];
                for (let e of this._tokenTypeOverrides)
                  e.matcher(t) && (r = C.set(r, 0, e.type, null, -1, 0, 0));
                this.balancedBracketSelectors &&
                  (n = this.balancedBracketSelectors.match(t));
              }
              if (
                (n && (r = C.set(r, 0, 8, n, -1, 0, 0)),
                this._binaryTokens.length > 0 &&
                  this._binaryTokens[this._binaryTokens.length - 1] === r)
              ) {
                this._lastTokenEndIndex = t;
                return;
              }
              (this._binaryTokens.push(this._lastTokenEndIndex),
                this._binaryTokens.push(r),
                (this._lastTokenEndIndex = t));
              return;
            }
            let r = e?.getScopeNames() ?? [];
            (this._tokens.push({
              startIndex: this._lastTokenEndIndex,
              endIndex: t,
              scopes: r,
            }),
              (this._lastTokenEndIndex = t));
          }
          getResult(e, t) {
            return (
              this._tokens.length > 0 &&
                this._tokens[this._tokens.length - 1].startIndex === t - 1 &&
                this._tokens.pop(),
              0 === this._tokens.length &&
                ((this._lastTokenEndIndex = -1),
                this.produce(e, t),
                (this._tokens[this._tokens.length - 1].startIndex = 0)),
              this._tokens
            );
          }
          getBinaryResult(e, t) {
            (this._binaryTokens.length > 0 &&
              this._binaryTokens[this._binaryTokens.length - 2] === t - 1 &&
              (this._binaryTokens.pop(), this._binaryTokens.pop()),
              0 === this._binaryTokens.length &&
                ((this._lastTokenEndIndex = -1),
                this.produce(e, t),
                (this._binaryTokens[this._binaryTokens.length - 2] = 0)));
            let r = new Uint32Array(this._binaryTokens.length);
            for (let e = 0, t = this._binaryTokens.length; e < t; e++)
              r[e] = this._binaryTokens[e];
            return r;
          }
        },
        eg = class {
          constructor(e, t) {
            ((this._onigLib = t), (this._theme = e));
          }
          _onigLib;
          _grammars = new Map();
          _rawGrammars = new Map();
          _injectionGrammars = new Map();
          _theme;
          dispose() {
            for (let e of this._grammars.values()) e.dispose();
          }
          setTheme(e) {
            this._theme = e;
          }
          getColorMap() {
            return this._theme.getColorMap();
          }
          addGrammar(e, t) {
            (this._rawGrammars.set(e.scopeName, e),
              t && this._injectionGrammars.set(e.scopeName, t));
          }
          lookup(e) {
            return this._rawGrammars.get(e);
          }
          injections(e) {
            return this._injectionGrammars.get(e);
          }
          getDefaults() {
            return this._theme.getDefaults();
          }
          themeMatch(e) {
            return this._theme.match(e);
          }
          grammarForScopeName(e, t, r, n, s) {
            if (!this._grammars.has(e)) {
              let a = this._rawGrammars.get(e);
              if (!a) return null;
              this._grammars.set(
                e,
                new el(e, a, t, r, n, s, this, this._onigLib),
              );
            }
            return this._grammars.get(e);
          }
        },
        ef = class {
          _options;
          _syncRegistry;
          _ensureGrammarCache;
          constructor(e) {
            ((this._options = e),
              (this._syncRegistry = new eg(
                d.createFromRawTheme(e.theme, e.colorMap),
                e.onigLib,
              )),
              (this._ensureGrammarCache = new Map()));
          }
          dispose() {
            this._syncRegistry.dispose();
          }
          setTheme(e, t) {
            this._syncRegistry.setTheme(d.createFromRawTheme(e, t));
          }
          getColorMap() {
            return this._syncRegistry.getColorMap();
          }
          loadGrammarWithEmbeddedLanguages(e, t, r) {
            return this.loadGrammarWithConfiguration(e, t, {
              embeddedLanguages: r,
            });
          }
          loadGrammarWithConfiguration(e, t, r) {
            return this._loadGrammar(
              e,
              t,
              r.embeddedLanguages,
              r.tokenTypes,
              new ep(
                r.balancedBracketSelectors || [],
                r.unbalancedBracketSelectors || [],
              ),
            );
          }
          loadGrammar(e) {
            return this._loadGrammar(e, 0, null, null, null);
          }
          _loadGrammar(e, t, r, n, s) {
            let a = new $(this._syncRegistry, e);
            for (; a.Q.length > 0;)
              (a.Q.map((e) => this._loadSingleGrammar(e.scopeName)),
                a.processQueue());
            return this._grammarForScopeName(e, t, r, n, s);
          }
          _loadSingleGrammar(e) {
            this._ensureGrammarCache.has(e) ||
              (this._doLoadSingleGrammar(e),
              this._ensureGrammarCache.set(e, !0));
          }
          _doLoadSingleGrammar(e) {
            let t = this._options.loadGrammar(e);
            if (t) {
              let r =
                "function" == typeof this._options.getInjections
                  ? this._options.getInjections(e)
                  : void 0;
              this._syncRegistry.addGrammar(t, r);
            }
          }
          addGrammar(e, t = [], r = 0, n = null) {
            return (
              this._syncRegistry.addGrammar(e, t),
              this._grammarForScopeName(e.scopeName, r, n)
            );
          }
          _grammarForScopeName(e, t = 0, r = null, n = null, s = null) {
            return this._syncRegistry.grammarForScopeName(e, t, r, n, s);
          }
        },
        em = eh.NULL;
      function ey(e, t) {
        let r = "string" == typeof e ? {} : { ...e.colorReplacements },
          n = "string" == typeof e ? e : e.name;
        for (let [e, s] of Object.entries(t?.colorReplacements || {}))
          "string" == typeof s ? (r[e] = s) : e === n && Object.assign(r, s);
        return r;
      }
      function eb(e, t) {
        return (e && t?.[e?.toLowerCase()]) || e;
      }
      async function e_(e) {
        return Promise.resolve("function" == typeof e ? e() : e).then(
          (e) => e.default || e,
        );
      }
      function ek(e) {
        return !e || ["plaintext", "txt", "text", "plain"].includes(e);
      }
      function ew(e) {
        return "ansi" === e || ek(e);
      }
      function eC(e) {
        return "none" === e;
      }
      let eS = /(\r?\n)/g;
      function ex(e, t = !1) {
        if (0 === e.length) return [["", 0]];
        let r = e.split(eS),
          n = 0,
          s = [];
        for (let e = 0; e < r.length; e += 2) {
          let a = t ? r[e] + (r[e + 1] || "") : r[e];
          (s.push([a, n]), (n += r[e].length), (n += r[e + 1]?.length || 0));
        }
        return s;
      }
      let ev = "__shiki_resolved";
      function eA(e) {
        if (e?.[ev]) return e;
        let t = { ...e };
        (t.tokenColors &&
          !t.settings &&
          ((t.settings = t.tokenColors), delete t.tokenColors),
          (t.type ||= "dark"),
          (t.colorReplacements = { ...t.colorReplacements }),
          (t.settings ||= []));
        let { bg: r, fg: n } = t;
        if (!r || !n) {
          let e = t.settings
            ? t.settings.find((e) => !e.name && !e.scope)
            : void 0;
          (e?.settings?.foreground && (n = e.settings.foreground),
            e?.settings?.background && (r = e.settings.background),
            !n &&
              t?.colors?.["editor.foreground"] &&
              (n = t.colors["editor.foreground"]),
            !r &&
              t?.colors?.["editor.background"] &&
              (r = t.colors["editor.background"]),
            n || (n = "light" === t.type ? "#333333" : "#bbbbbb"),
            r || (r = "light" === t.type ? "#fffffe" : "#1e1e1e"),
            (t.fg = n),
            (t.bg = r));
        }
        (t.settings[0] && t.settings[0].settings && !t.settings[0].scope) ||
          t.settings.unshift({
            settings: { foreground: t.fg, background: t.bg },
          });
        let s = 0,
          a = new Map();
        function i(e) {
          if (a.has(e)) return a.get(e);
          s += 1;
          let r = `#${s.toString(16).padStart(8, "0").toLowerCase()}`;
          return t.colorReplacements?.[`#${r}`] ? i(e) : (a.set(e, r), r);
        }
        for (let e of ((t.settings = t.settings.map((e) => {
          let r =
              e.settings?.foreground && !e.settings.foreground.startsWith("#"),
            n =
              e.settings?.background && !e.settings.background.startsWith("#");
          if (!r && !n) return e;
          let s = { ...e, settings: { ...e.settings } };
          if (r) {
            let r = i(e.settings.foreground);
            ((t.colorReplacements[r] = e.settings.foreground),
              (s.settings.foreground = r));
          }
          if (n) {
            let r = i(e.settings.background);
            ((t.colorReplacements[r] = e.settings.background),
              (s.settings.background = r));
          }
          return s;
        })),
        Object.keys(t.colors || {})))
          if (
            ("editor.foreground" === e ||
              "editor.background" === e ||
              e.startsWith("terminal.ansi")) &&
            !t.colors[e]?.startsWith("#")
          ) {
            let r = i(t.colors[e]);
            ((t.colorReplacements[r] = t.colors[e]), (t.colors[e] = r));
          }
        return (
          Object.defineProperty(t, ev, {
            enumerable: !1,
            writable: !1,
            value: !0,
          }),
          t
        );
      }
      async function eN(e) {
        return [
          ...new Set(
            (
              await Promise.all(
                e
                  .filter((e) => !ew(e))
                  .map(
                    async (e) =>
                      await e_(e).then((e) => (Array.isArray(e) ? e : [e])),
                  ),
              )
            ).flat(),
          ),
        ];
      }
      async function eE(e) {
        return (
          await Promise.all(
            e.map(async (e) => (eC(e) ? null : eA(await e_(e)))),
          )
        ).filter((e) => !!e);
      }
      function eI(e, t) {
        if (!t) return e;
        if (t[e]) {
          let r = new Set([e]);
          for (; t[e];) {
            if (((e = t[e]), r.has(e)))
              throw new s(`Circular alias \`${[...r].join(" -> ")} -> ${e}\``);
            r.add(e);
          }
        }
        return e;
      }
      var e$ = class extends ef {
          _resolver;
          _themes;
          _langs;
          _alias;
          _resolvedThemes = new Map();
          _resolvedGrammars = new Map();
          _langMap = new Map();
          _langGraph = new Map();
          _textmateThemeCache = new WeakMap();
          _loadedThemesCache = null;
          _loadedLanguagesCache = null;
          constructor(e, t, r, n = {}) {
            (super(e),
              (this._resolver = e),
              (this._themes = t),
              (this._langs = r),
              (this._alias = n),
              this._themes.map((e) => this.loadTheme(e)),
              this.loadLanguages(this._langs));
          }
          getTheme(e) {
            return "string" == typeof e
              ? this._resolvedThemes.get(e)
              : this.loadTheme(e);
          }
          loadTheme(e) {
            let t = eA(e);
            return (
              t.name &&
                (this._resolvedThemes.set(t.name, t),
                (this._loadedThemesCache = null)),
              t
            );
          }
          getLoadedThemes() {
            return (
              this._loadedThemesCache ||
                (this._loadedThemesCache = [...this._resolvedThemes.keys()]),
              this._loadedThemesCache
            );
          }
          setTheme(e) {
            let t = this._textmateThemeCache.get(e);
            (t ||
              ((t = d.createFromRawTheme(e)),
              this._textmateThemeCache.set(e, t)),
              this._syncRegistry.setTheme(t));
          }
          getGrammar(e) {
            return ((e = eI(e, this._alias)), this._resolvedGrammars.get(e));
          }
          loadLanguage(e) {
            if (this.getGrammar(e.name)) return;
            let t = new Set(
              [...this._langMap.values()].filter((t) =>
                t.embeddedLangsLazy?.includes(e.name),
              ),
            );
            this._resolver.addLanguage(e);
            let r = {
              balancedBracketSelectors: e.balancedBracketSelectors || ["*"],
              unbalancedBracketSelectors: e.unbalancedBracketSelectors || [],
            };
            this._syncRegistry._rawGrammars.set(e.scopeName, e);
            let n = this.loadGrammarWithConfiguration(e.scopeName, 1, r);
            for (let r of ((n.name = e.name),
            this._resolvedGrammars.set(e.name, n),
            e.aliases &&
              e.aliases.forEach((t) => {
                this._alias[t] = e.name;
              }),
            (this._loadedLanguagesCache = null),
            t))
              this.reloadLanguage(r);
            if (e.injectTo)
              for (let t of [...this._langMap.values()].filter(
                (t) =>
                  t !== e &&
                  this._resolvedGrammars.has(t.name) &&
                  e.injectTo.some(
                    (e) => t.scopeName === e || t.scopeName.startsWith(`${e}.`),
                  ) &&
                  !this.hasCurrentInjections(t.scopeName),
              ))
                this.reloadLanguage(t);
          }
          hasCurrentInjections(e) {
            let t = this._syncRegistry?._injectionGrammars?.get(e) || [],
              r = this._resolver.getInjections(e) || [];
            return t.length === r.length && t.every((e, t) => e === r[t]);
          }
          reloadLanguage(e) {
            (this._syncRegistry?._grammars?.get(e.scopeName)?.dispose(),
              this._resolvedGrammars.delete(e.name),
              (this._loadedLanguagesCache = null),
              this._syncRegistry?._grammars?.delete(e.scopeName),
              this._syncRegistry?._injectionGrammars?.set(
                e.scopeName,
                this._resolver.getInjections(e.scopeName) || [],
              ),
              this.loadLanguage(this._langMap.get(e.name) || e));
          }
          dispose() {
            (super.dispose(),
              this._resolvedThemes.clear(),
              this._resolvedGrammars.clear(),
              this._langMap.clear(),
              this._langGraph.clear(),
              (this._loadedThemesCache = null));
          }
          loadLanguages(e) {
            for (let t of e) this.resolveEmbeddedLanguages(t);
            let t = [...this._langGraph.entries()],
              r = t.filter(([e, t]) => !t);
            if (r.length) {
              let e = t
                .filter(
                  ([e, t]) =>
                    !!t &&
                    (t.embeddedLanguages || t.embeddedLangs)?.some((e) =>
                      r.map(([e]) => e).includes(e),
                    ),
                )
                .filter((e) => !r.includes(e));
              throw new s(
                `Missing languages ${r.map(([e]) => `\`${e}\``).join(", ")}, required by ${e.map(([e]) => `\`${e}\``).join(", ")}`,
              );
            }
            for (let [e, r] of t) this._resolver.addLanguage(r);
            for (let [e, r] of t) this.loadLanguage(r);
          }
          getLoadedLanguages() {
            return (
              this._loadedLanguagesCache ||
                (this._loadedLanguagesCache = [
                  ...new Set([
                    ...this._resolvedGrammars.keys(),
                    ...Object.keys(this._alias),
                  ]),
                ]),
              this._loadedLanguagesCache
            );
          }
          resolveEmbeddedLanguages(e) {
            (this._langMap.set(e.name, e), this._langGraph.set(e.name, e));
            let t = e.embeddedLanguages ?? e.embeddedLangs;
            if (t)
              for (let e of t) this._langGraph.set(e, this._langMap.get(e));
          }
        },
        eL = class {
          _langs = new Map();
          _scopeToLang = new Map();
          _injections = new Map();
          _onigLib;
          constructor(e, t) {
            ((this._onigLib = {
              createOnigScanner: (t) => e.createScanner(t),
              createOnigString: (t) => e.createString(t),
            }),
              t.forEach((e) => this.addLanguage(e)));
          }
          get onigLib() {
            return this._onigLib;
          }
          getLangRegistration(e) {
            return this._langs.get(e);
          }
          loadGrammar(e) {
            return this._scopeToLang.get(e);
          }
          addLanguage(e) {
            (this._langs.set(e.name, e),
              e.aliases &&
                e.aliases.forEach((t) => {
                  this._langs.set(t, e);
                }),
              this._scopeToLang.set(e.scopeName, e),
              e.injectTo &&
                e.injectTo.forEach((t) => {
                  (this._injections.get(t) || this._injections.set(t, []),
                    this._injections.get(t).includes(e.scopeName) ||
                      this._injections.get(t).push(e.scopeName));
                }));
          }
          getInjections(e) {
            let t = e.split("."),
              r = [];
            for (let e = 1; e <= t.length; e++) {
              let n = t.slice(0, e).join(".");
              r = [...r, ...(this._injections.get(n) || [])];
            }
            return r;
          }
        };
      let eP = 0;
      function eR(e) {
        let t;
        ((eP += 1),
          !1 !== e.warnings &&
            eP >= 10 &&
            eP % 10 == 0 &&
            console.warn(
              `[Shiki] ${eP} instances have been created. Shiki is supposed to be used as a singleton, consider refactoring your code to cache your highlighter instance; Or call \`highlighter.dispose()\` to release unused instances.`,
            ));
        let r = !1;
        if (!e.engine)
          throw new s("`engine` option is required for synchronous mode");
        let n = (e.langs || []).flat(1),
          a = (e.themes || []).flat(1).map(eA),
          i = new e$(new eL(e.engine, n), a, n, e.langAlias);
        function o(e) {
          if ("none" === e)
            return { bg: "", fg: "", name: "none", settings: [], type: "dark" };
          u();
          let t = i.getTheme(e);
          if (!t)
            throw new s(
              `Theme \`${e}\` not found, you may need to load it first`,
            );
          return t;
        }
        function l(...e) {
          (u(), i.loadLanguages(e.flat(1)));
        }
        function c(...e) {
          for (let t of (u(), e.flat(1))) i.loadTheme(t);
        }
        function u() {
          if (r) throw new s("Shiki instance has been disposed");
        }
        function h() {
          r || ((r = !0), i.dispose(), (eP -= 1));
        }
        return {
          setTheme: function (e) {
            u();
            let r = o(e);
            return (
              t !== e && (i.setTheme(r), (t = e)),
              { theme: r, colorMap: i.getColorMap() }
            );
          },
          getTheme: o,
          getLanguage: function (e) {
            u();
            let t = i.getGrammar("string" == typeof e ? e : e.name);
            if (!t)
              throw new s(
                `Language \`${e}\` not found, you may need to load it first`,
              );
            return t;
          },
          getLoadedThemes: function () {
            return (u(), i.getLoadedThemes());
          },
          getLoadedLanguages: function () {
            return (u(), i.getLoadedLanguages());
          },
          resolveLangAlias: function (t) {
            return eI(t, e.langAlias);
          },
          loadLanguage: async function (...e) {
            return l(await eN(e));
          },
          loadLanguageSync: l,
          loadTheme: async function (...e) {
            return (u(), c(await eE(e)));
          },
          loadThemeSync: c,
          dispose: h,
          [Symbol.dispose]: h,
        };
      }
      async function eT(e) {
        e.engine ||
          console.warn(
            "`engine` option is required. Use `createOnigurumaEngine` or `createJavaScriptRegexEngine` to create an engine.",
          );
        let [t, r, n] = await Promise.all([
          eE(e.themes || []),
          eN(e.langs || []),
          e.engine,
        ]);
        return eR({ ...e, themes: t, langs: r, engine: n });
      }
      let eM = new WeakMap();
      function eG(e, t) {
        eM.set(e, t);
      }
      function eB(e) {
        return eM.get(e);
      }
      var eO = class e {
        _stacks = {};
        lang;
        get themes() {
          return Object.keys(this._stacks);
        }
        get theme() {
          return this.themes[0];
        }
        get _stack() {
          return this._stacks[this.theme];
        }
        static initial(t, r) {
          return new e(
            Object.fromEntries(
              (Array.isArray(r) ? r : [r]).map((e) => [e, em]),
            ),
            t,
          );
        }
        constructor(...e) {
          if (2 === e.length) {
            let [t, r] = e;
            ((this.lang = r), (this._stacks = t));
          } else {
            let [t, r, n] = e;
            ((this.lang = r), (this._stacks = { [n]: t }));
          }
        }
        getInternalStack(e = this.theme) {
          return this._stacks[e];
        }
        getScopes(e = this.theme) {
          var t;
          let r, n;
          return (
            (t = this._stacks[e]),
            (r = []),
            (n = new Set()),
            !(function e(t) {
              if (n.has(t)) return;
              n.add(t);
              let s = t?.nameScopesList?.scopeName;
              (s && r.push(s), t.parent && e(t.parent));
            })(t),
            r
          );
        }
        toJSON() {
          return {
            lang: this.lang,
            theme: this.theme,
            themes: this.themes,
            scopes: this.getScopes(),
          };
        }
      };
      let eF = /,/,
        eD = / /;
      function ej(e, t, r = {}) {
        var n, a;
        let i,
          o,
          { theme: l = e.getLoadedThemes()[0] } = r;
        if (ek(e.resolveLangAlias(r.lang || "text")) || eC(l))
          return ex(t).map((e) => [{ content: e[0], offset: e[1] }]);
        let { theme: c, colorMap: u } = e.setTheme(l),
          h = e.getLanguage(r.lang || "text");
        if (r.grammarState) {
          if (r.grammarState.lang !== h.name)
            throw new s(
              `Grammar state language "${r.grammarState.lang}" does not match highlight language "${h.name}"`,
            );
          if (!r.grammarState.themes.includes(c.name))
            throw new s(
              `Grammar state themes "${r.grammarState.themes}" do not contain highlight theme "${c.name}"`,
            );
        }
        return (
          (o = new eO(
            (i = eW(t, (n = h), (a = c), u, r)).stateStack,
            n.name,
            a.name,
          )),
          eG(i.tokens, o),
          i.tokens
        );
      }
      function eU(...e) {
        if (2 === e.length) return eB(e[1]);
        let [t, r, n = {}] = e,
          { lang: a = "text", theme: i = t.getLoadedThemes()[0] } = n;
        if (ek(a) || eC(i))
          throw new s("Plain language does not have grammar state");
        if ("ansi" === a)
          throw new s("ANSI language does not have grammar state");
        let { theme: o, colorMap: l } = t.setTheme(i),
          c = t.getLanguage(a);
        return new eO(eW(r, c, o, l, n).stateStack, c.name, o.name);
      }
      function eW(e, t, r, n, a) {
        let i = ey(r, a),
          {
            tokenizeMaxLineLength: o = 0,
            tokenizeTimeLimit: l = 500,
            includeExplanation: c = !1,
          } = a,
          u = ex(e),
          h = a.grammarState
            ? ((function (e, t) {
                if (!(e instanceof eO)) throw new s("Invalid grammar state");
                return e.getInternalStack(t);
              })(a.grammarState, r.name) ?? em)
            : null != a.grammarContextCode
              ? eW(a.grammarContextCode, t, r, n, {
                  ...a,
                  grammarState: void 0,
                  grammarContextCode: void 0,
                }).stateStack
              : em,
          p = [],
          d = [];
        for (let e = 0, s = u.length; e < s; e++) {
          let s,
            a,
            [g, f] = u[e];
          if ("" === g) {
            ((p = []), d.push([]));
            continue;
          }
          if (o > 0 && g.length >= o) {
            ((p = []),
              d.push([{ content: g, offset: f, color: "", fontStyle: 0 }]));
            continue;
          }
          c &&
            "tokenType" !== c &&
            ((s = t.tokenizeLine(g, h, l).tokens), (a = 0));
          let m = t.tokenizeLine2(g, h, l),
            y = m.tokens.length / 2;
          for (let e = 0; e < y; e++) {
            let t = m.tokens[2 * e],
              o = e + 1 < y ? m.tokens[2 * e + 2] : g.length;
            if (t === o) continue;
            let l = m.tokens[2 * e + 1],
              u = eb(n[C.getForeground(l)], i),
              h = C.getFontStyle(l),
              d = {
                content: g.substring(t, o),
                offset: f + t,
                color: u,
                fontStyle: h,
              };
            if ("tokenType" === c) d.type = C.getTokenType(l);
            else if (c) {
              let e = [];
              if ("scopeName" !== c)
                for (let t of r.settings) {
                  let r;
                  switch (typeof t.scope) {
                    case "string":
                      r = t.scope.split(eF).map((e) => e.trim());
                      break;
                    case "object":
                      r = t.scope;
                      break;
                    default:
                      continue;
                  }
                  e.push({ settings: t, selectors: r.map((e) => e.split(eD)) });
                }
              d.explanation = [];
              let n = 0;
              for (; t + n < o;) {
                let t = s[a],
                  r = g.substring(t.startIndex, t.endIndex);
                ((n += r.length),
                  d.explanation.push({
                    content: r,
                    scopes:
                      "scopeName" === c
                        ? t.scopes.map((e) => ({ scopeName: e }))
                        : (function (e, t) {
                            let r = [];
                            for (let n = 0, s = t.length; n < s; n++) {
                              let s = t[n];
                              r[n] = {
                                scopeName: s,
                                themeMatches: (function (e, t, r) {
                                  let n = [];
                                  for (let { selectors: s, settings: a } of e)
                                    for (let e of s)
                                      if (
                                        (function (e, t, r) {
                                          if (!eq(e.at(-1), t)) return !1;
                                          let n = e.length - 2,
                                            s = r.length - 1;
                                          for (; n >= 0 && s >= 0;)
                                            (eq(e[n], r[s]) && (n -= 1),
                                              (s -= 1));
                                          return -1 === n;
                                        })(e, t, r)
                                      ) {
                                        n.push(a);
                                        break;
                                      }
                                  return n;
                                })(e, s, t.slice(0, n)),
                              };
                            }
                            return r;
                          })(e, t.scopes),
                  }),
                  (a += 1));
              }
            }
            p.push(d);
          }
          (d.push(p), (p = []), (h = m.ruleStack));
        }
        return { tokens: d, stateStack: h };
      }
      function eq(e, t) {
        return (
          e === t || (t.substring(0, e.length) === e && "." === t[e.length])
        );
      }
      function ez(e, t, r, n = ej) {
        let s = Object.entries(r.themes)
            .filter((e) => e[1])
            .map((e) => ({ color: e[0], theme: e[1] })),
          a = s.map((s) => {
            let a = n(e, t, { ...r, theme: s.theme });
            return {
              tokens: a,
              state: eB(a),
              theme: "string" == typeof s.theme ? s.theme : s.theme.name,
            };
          }),
          i = (function (...e) {
            let t = e.map(() => []),
              r = e.length;
            for (let n = 0; n < e[0].length; n++) {
              let s = e.map((e) => e[n]),
                a = t.map(() => []);
              t.forEach((e, t) => e.push(a[t]));
              let i = s.map(() => 0),
                o = s.map((e) => e[0]);
              for (; o.every((e) => e);) {
                let e = Math.min(...o.map((e) => e.content.length));
                for (let t = 0; t < r; t++) {
                  let r = o[t];
                  r.content.length === e
                    ? (a[t].push(r), (i[t] += 1), (o[t] = s[t][i[t]]))
                    : (a[t].push({ ...r, content: r.content.slice(0, e) }),
                      (o[t] = {
                        ...r,
                        content: r.content.slice(e),
                        offset: r.offset + e,
                      }));
                }
              }
            }
            return t;
          })(...a.map((e) => e.tokens)),
          o = i[0].map((e, t) =>
            e.map((e, n) => {
              let a = { content: e.content, variants: {}, offset: e.offset };
              return (
                "includeExplanation" in r &&
                  r.includeExplanation &&
                  (a.explanation = e.explanation),
                i.forEach((e, r) => {
                  let { content: i, explanation: o, offset: l, ...c } = e[t][n];
                  a.variants[s[r].color] = c;
                }),
                a
              );
            }),
          ),
          l = a[0].state
            ? new eO(
                Object.fromEntries(
                  a.map((e) => [e.theme, e.state?.getInternalStack(e.theme)]),
                ),
                a[0].state.lang,
              )
            : void 0;
        return (l && eG(o, l), o);
      }
      var eH = e.i(241631),
        eV = e.i(157871),
        eX = e.i(369587);
      let eQ = /["&'<>`]/g,
        eZ = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g,
        eK = /[\x01-\t\v\f\x0E-\x1F\x7F\x81\x8D\x8F\x90\x9D\xA0-\uFFFF]/g,
        eY = /[|\\{}()[\]^$+*?.]/g,
        eJ = new WeakMap(),
        e0 = /[\dA-Fa-f]/,
        e1 = /\d/,
        e2 = [
          "AElig",
          "AMP",
          "Aacute",
          "Acirc",
          "Agrave",
          "Aring",
          "Atilde",
          "Auml",
          "COPY",
          "Ccedil",
          "ETH",
          "Eacute",
          "Ecirc",
          "Egrave",
          "Euml",
          "GT",
          "Iacute",
          "Icirc",
          "Igrave",
          "Iuml",
          "LT",
          "Ntilde",
          "Oacute",
          "Ocirc",
          "Ograve",
          "Oslash",
          "Otilde",
          "Ouml",
          "QUOT",
          "REG",
          "THORN",
          "Uacute",
          "Ucirc",
          "Ugrave",
          "Uuml",
          "Yacute",
          "aacute",
          "acirc",
          "acute",
          "aelig",
          "agrave",
          "amp",
          "aring",
          "atilde",
          "auml",
          "brvbar",
          "ccedil",
          "cedil",
          "cent",
          "copy",
          "curren",
          "deg",
          "divide",
          "eacute",
          "ecirc",
          "egrave",
          "eth",
          "euml",
          "frac12",
          "frac14",
          "frac34",
          "gt",
          "iacute",
          "icirc",
          "iexcl",
          "igrave",
          "iquest",
          "iuml",
          "laquo",
          "lt",
          "macr",
          "micro",
          "middot",
          "nbsp",
          "not",
          "ntilde",
          "oacute",
          "ocirc",
          "ograve",
          "ordf",
          "ordm",
          "oslash",
          "otilde",
          "ouml",
          "para",
          "plusmn",
          "pound",
          "quot",
          "raquo",
          "reg",
          "sect",
          "shy",
          "sup1",
          "sup2",
          "sup3",
          "szlig",
          "thorn",
          "times",
          "uacute",
          "ucirc",
          "ugrave",
          "uml",
          "uuml",
          "yacute",
          "yen",
          "yuml",
        ],
        e3 = {
          nbsp: " ",
          iexcl: "¡",
          cent: "¢",
          pound: "£",
          curren: "¤",
          yen: "¥",
          brvbar: "¦",
          sect: "§",
          uml: "¨",
          copy: "©",
          ordf: "ª",
          laquo: "«",
          not: "¬",
          shy: "­",
          reg: "®",
          macr: "¯",
          deg: "°",
          plusmn: "±",
          sup2: "²",
          sup3: "³",
          acute: "´",
          micro: "µ",
          para: "¶",
          middot: "·",
          cedil: "¸",
          sup1: "¹",
          ordm: "º",
          raquo: "»",
          frac14: "¼",
          frac12: "½",
          frac34: "¾",
          iquest: "¿",
          Agrave: "À",
          Aacute: "Á",
          Acirc: "Â",
          Atilde: "Ã",
          Auml: "Ä",
          Aring: "Å",
          AElig: "Æ",
          Ccedil: "Ç",
          Egrave: "È",
          Eacute: "É",
          Ecirc: "Ê",
          Euml: "Ë",
          Igrave: "Ì",
          Iacute: "Í",
          Icirc: "Î",
          Iuml: "Ï",
          ETH: "Ð",
          Ntilde: "Ñ",
          Ograve: "Ò",
          Oacute: "Ó",
          Ocirc: "Ô",
          Otilde: "Õ",
          Ouml: "Ö",
          times: "×",
          Oslash: "Ø",
          Ugrave: "Ù",
          Uacute: "Ú",
          Ucirc: "Û",
          Uuml: "Ü",
          Yacute: "Ý",
          THORN: "Þ",
          szlig: "ß",
          agrave: "à",
          aacute: "á",
          acirc: "â",
          atilde: "ã",
          auml: "ä",
          aring: "å",
          aelig: "æ",
          ccedil: "ç",
          egrave: "è",
          eacute: "é",
          ecirc: "ê",
          euml: "ë",
          igrave: "ì",
          iacute: "í",
          icirc: "î",
          iuml: "ï",
          eth: "ð",
          ntilde: "ñ",
          ograve: "ò",
          oacute: "ó",
          ocirc: "ô",
          otilde: "õ",
          ouml: "ö",
          divide: "÷",
          oslash: "ø",
          ugrave: "ù",
          uacute: "ú",
          ucirc: "û",
          uuml: "ü",
          yacute: "ý",
          thorn: "þ",
          yuml: "ÿ",
          fnof: "ƒ",
          Alpha: "Α",
          Beta: "Β",
          Gamma: "Γ",
          Delta: "Δ",
          Epsilon: "Ε",
          Zeta: "Ζ",
          Eta: "Η",
          Theta: "Θ",
          Iota: "Ι",
          Kappa: "Κ",
          Lambda: "Λ",
          Mu: "Μ",
          Nu: "Ν",
          Xi: "Ξ",
          Omicron: "Ο",
          Pi: "Π",
          Rho: "Ρ",
          Sigma: "Σ",
          Tau: "Τ",
          Upsilon: "Υ",
          Phi: "Φ",
          Chi: "Χ",
          Psi: "Ψ",
          Omega: "Ω",
          alpha: "α",
          beta: "β",
          gamma: "γ",
          delta: "δ",
          epsilon: "ε",
          zeta: "ζ",
          eta: "η",
          theta: "θ",
          iota: "ι",
          kappa: "κ",
          lambda: "λ",
          mu: "μ",
          nu: "ν",
          xi: "ξ",
          omicron: "ο",
          pi: "π",
          rho: "ρ",
          sigmaf: "ς",
          sigma: "σ",
          tau: "τ",
          upsilon: "υ",
          phi: "φ",
          chi: "χ",
          psi: "ψ",
          omega: "ω",
          thetasym: "ϑ",
          upsih: "ϒ",
          piv: "ϖ",
          bull: "•",
          hellip: "…",
          prime: "′",
          Prime: "″",
          oline: "‾",
          frasl: "⁄",
          weierp: "℘",
          image: "ℑ",
          real: "ℜ",
          trade: "™",
          alefsym: "ℵ",
          larr: "←",
          uarr: "↑",
          rarr: "→",
          darr: "↓",
          harr: "↔",
          crarr: "↵",
          lArr: "⇐",
          uArr: "⇑",
          rArr: "⇒",
          dArr: "⇓",
          hArr: "⇔",
          forall: "∀",
          part: "∂",
          exist: "∃",
          empty: "∅",
          nabla: "∇",
          isin: "∈",
          notin: "∉",
          ni: "∋",
          prod: "∏",
          sum: "∑",
          minus: "−",
          lowast: "∗",
          radic: "√",
          prop: "∝",
          infin: "∞",
          ang: "∠",
          and: "∧",
          or: "∨",
          cap: "∩",
          cup: "∪",
          int: "∫",
          there4: "∴",
          sim: "∼",
          cong: "≅",
          asymp: "≈",
          ne: "≠",
          equiv: "≡",
          le: "≤",
          ge: "≥",
          sub: "⊂",
          sup: "⊃",
          nsub: "⊄",
          sube: "⊆",
          supe: "⊇",
          oplus: "⊕",
          otimes: "⊗",
          perp: "⊥",
          sdot: "⋅",
          lceil: "⌈",
          rceil: "⌉",
          lfloor: "⌊",
          rfloor: "⌋",
          lang: "〈",
          rang: "〉",
          loz: "◊",
          spades: "♠",
          clubs: "♣",
          hearts: "♥",
          diams: "♦",
          quot: '"',
          amp: "&",
          lt: "<",
          gt: ">",
          OElig: "Œ",
          oelig: "œ",
          Scaron: "Š",
          scaron: "š",
          Yuml: "Ÿ",
          circ: "ˆ",
          tilde: "˜",
          ensp: " ",
          emsp: " ",
          thinsp: " ",
          zwnj: "‌",
          zwj: "‍",
          lrm: "‎",
          rlm: "‏",
          ndash: "–",
          mdash: "—",
          lsquo: "‘",
          rsquo: "’",
          sbquo: "‚",
          ldquo: "“",
          rdquo: "”",
          bdquo: "„",
          dagger: "†",
          Dagger: "‡",
          permil: "‰",
          lsaquo: "‹",
          rsaquo: "›",
          euro: "€",
        },
        e5 = ["cent", "copy", "divide", "gt", "lt", "not", "para", "times"],
        e8 = {}.hasOwnProperty,
        e4 = {};
      for (t in e3) e8.call(e3, t) && (e4[e3[t]] = t);
      let e6 = /[^\dA-Za-z]/;
      function e9(e, t, r) {
        var n, s;
        let a,
          i,
          o =
            ((n = r.omitOptionalSemicolons),
            (a = "&#x" + e.toString(16).toUpperCase()),
            n && t && !e0.test(String.fromCharCode(t)) ? a : a + ";");
        if (
          ((r.useNamedReferences || r.useShortestReferences) &&
            (i = (function (e, t, r, n) {
              let s = String.fromCharCode(e);
              if (e8.call(e4, s)) {
                let e = e4[s],
                  a = "&" + e;
                return r &&
                  e2.includes(e) &&
                  !e5.includes(e) &&
                  (!n || (t && 61 !== t && e6.test(String.fromCharCode(t))))
                  ? a
                  : a + ";";
              }
              return "";
            })(e, t, r.omitOptionalSemicolons, r.attribute)),
          (r.useShortestReferences || !i) && r.useShortestReferences)
        ) {
          let n,
            a =
              ((s = r.omitOptionalSemicolons),
              (n = "&#" + String(e)),
              s && t && !e1.test(String.fromCharCode(t)) ? n : n + ";");
          a.length < o.length && (o = a);
        }
        return i && (!r.useShortestReferences || i.length < o.length) ? i : o;
      }
      function e7(e, t) {
        let r;
        var n,
          s = e,
          a = Object.assign({ format: e9 }, t);
        if (
          ((s = s.replace(
            a.subset
              ? ((n = a.subset),
                (r = eJ.get(n)) ||
                  ((r = (function (e) {
                    let t = [],
                      r = -1;
                    for (; ++r < e.length;) t.push(e[r].replace(eY, "\\$&"));
                    return RegExp("(?:" + t.join("|") + ")", "g");
                  })(n)),
                  eJ.set(n, r)),
                r)
              : eQ,
            i,
          )),
          a.subset || a.escapeOnly)
        )
          return s;
        return s
          .replace(eZ, function (e, t, r) {
            return a.format(
              (e.charCodeAt(0) - 55296) * 1024 +
                e.charCodeAt(1) -
                56320 +
                65536,
              r.charCodeAt(t + 2),
              a,
            );
          })
          .replace(eK, i);
        function i(e, t, r) {
          return a.format(e.charCodeAt(0), r.charCodeAt(t + 1), a);
        }
      }
      let te = /^>|^->|<!--|-->|--!>|<!-$/g,
        tt = [">"],
        tr = ["<", ">"];
      var tn = e.i(496481),
        ts = e.i(76696),
        ta = e.i(640553),
        ti = e.i(359091),
        to = e.i(124963);
      let tl = th(1),
        tc = th(-1),
        tu = [];
      function th(e) {
        return function (t, r, n) {
          let s = t ? t.children : tu,
            a = (r || 0) + e,
            i = s[a];
          if (!n) for (; i && (0, to.f)(i);) ((a += e), (i = s[a]));
          return i;
        };
      }
      let tp = {}.hasOwnProperty;
      function td(e) {
        return function (t, r, n) {
          return tp.call(e, t.tagName) && e[t.tagName](t, r, n);
        };
      }
      let tg = td({
        body: function (e, t, r) {
          let n = tl(r, t);
          return !n || "comment" !== n.type;
        },
        caption: tf,
        colgroup: tf,
        dd: function (e, t, r) {
          let n = tl(r, t);
          return (
            !n ||
            ("element" === n.type && ("dt" === n.tagName || "dd" === n.tagName))
          );
        },
        dt: function (e, t, r) {
          let n = tl(r, t);
          return !!(
            n &&
            "element" === n.type &&
            ("dt" === n.tagName || "dd" === n.tagName)
          );
        },
        head: tf,
        html: function (e, t, r) {
          let n = tl(r, t);
          return !n || "comment" !== n.type;
        },
        li: function (e, t, r) {
          let n = tl(r, t);
          return !n || ("element" === n.type && "li" === n.tagName);
        },
        optgroup: function (e, t, r) {
          let n = tl(r, t);
          return !n || ("element" === n.type && "optgroup" === n.tagName);
        },
        option: function (e, t, r) {
          let n = tl(r, t);
          return (
            !n ||
            ("element" === n.type &&
              ("option" === n.tagName || "optgroup" === n.tagName))
          );
        },
        p: function (e, t, r) {
          let n = tl(r, t);
          return n
            ? "element" === n.type &&
                ("address" === n.tagName ||
                  "article" === n.tagName ||
                  "aside" === n.tagName ||
                  "blockquote" === n.tagName ||
                  "details" === n.tagName ||
                  "div" === n.tagName ||
                  "dl" === n.tagName ||
                  "fieldset" === n.tagName ||
                  "figcaption" === n.tagName ||
                  "figure" === n.tagName ||
                  "footer" === n.tagName ||
                  "form" === n.tagName ||
                  "h1" === n.tagName ||
                  "h2" === n.tagName ||
                  "h3" === n.tagName ||
                  "h4" === n.tagName ||
                  "h5" === n.tagName ||
                  "h6" === n.tagName ||
                  "header" === n.tagName ||
                  "hgroup" === n.tagName ||
                  "hr" === n.tagName ||
                  "main" === n.tagName ||
                  "menu" === n.tagName ||
                  "nav" === n.tagName ||
                  "ol" === n.tagName ||
                  "p" === n.tagName ||
                  "pre" === n.tagName ||
                  "section" === n.tagName ||
                  "table" === n.tagName ||
                  "ul" === n.tagName)
            : !r ||
                !(
                  "element" === r.type &&
                  ("a" === r.tagName ||
                    "audio" === r.tagName ||
                    "del" === r.tagName ||
                    "ins" === r.tagName ||
                    "map" === r.tagName ||
                    "noscript" === r.tagName ||
                    "video" === r.tagName ||
                    r.tagName.includes("-"))
                );
        },
        rp: tm,
        rt: tm,
        tbody: function (e, t, r) {
          let n = tl(r, t);
          return (
            !n ||
            ("element" === n.type &&
              ("tbody" === n.tagName || "tfoot" === n.tagName))
          );
        },
        td: ty,
        tfoot: function (e, t, r) {
          return !tl(r, t);
        },
        th: ty,
        thead: function (e, t, r) {
          let n = tl(r, t);
          return !!(
            n &&
            "element" === n.type &&
            ("tbody" === n.tagName || "tfoot" === n.tagName)
          );
        },
        tr: function (e, t, r) {
          let n = tl(r, t);
          return !n || ("element" === n.type && "tr" === n.tagName);
        },
      });
      function tf(e, t, r) {
        let n = tl(r, t, !0);
        return (
          !n ||
          ("comment" !== n.type &&
            !("text" === n.type && (0, to.f)(n.value.charAt(0))))
        );
      }
      function tm(e, t, r) {
        let n = tl(r, t);
        return (
          !n ||
          ("element" === n.type && ("rp" === n.tagName || "rt" === n.tagName))
        );
      }
      function ty(e, t, r) {
        let n = tl(r, t);
        return (
          !n ||
          ("element" === n.type && ("td" === n.tagName || "th" === n.tagName))
        );
      }
      let tb = td({
          body: function (e) {
            let t = tl(e, -1, !0);
            return (
              !t ||
              ("comment" !== t.type &&
                !("text" === t.type && (0, to.f)(t.value.charAt(0))) &&
                ("element" !== t.type ||
                  ("meta" !== t.tagName &&
                    "link" !== t.tagName &&
                    "script" !== t.tagName &&
                    "style" !== t.tagName &&
                    "template" !== t.tagName)))
            );
          },
          colgroup: function (e, t, r) {
            let n = tc(r, t);
            if (
              r &&
              n &&
              "element" === n.type &&
              "colgroup" === n.tagName &&
              tg(n, r.children.indexOf(n), r)
            )
              return !1;
            let s = tl(e, -1, !0);
            return !!(s && "element" === s.type && "col" === s.tagName);
          },
          head: function (e) {
            let t = new Set();
            for (let r of e.children)
              if (
                "element" === r.type &&
                ("base" === r.tagName || "title" === r.tagName)
              ) {
                if (t.has(r.tagName)) return !1;
                t.add(r.tagName);
              }
            let r = e.children[0];
            return !r || "element" === r.type;
          },
          html: function (e) {
            let t = tl(e, -1);
            return !t || "comment" !== t.type;
          },
          tbody: function (e, t, r) {
            let n = tc(r, t);
            if (
              r &&
              n &&
              "element" === n.type &&
              ("thead" === n.tagName || "tbody" === n.tagName) &&
              tg(n, r.children.indexOf(n), r)
            )
              return !1;
            let s = tl(e, -1);
            return !!(s && "element" === s.type && "tr" === s.tagName);
          },
        }),
        t_ = {
          name: [
            ["	\n\f\r &/=>".split(""), "	\n\f\r \"&'/=>`".split("")],
            ["\0	\n\f\r \"&'/<=>".split(""), "\0	\n\f\r \"&'/<=>`".split("")],
          ],
          unquoted: [
            ["	\n\f\r &>".split(""), "\0	\n\f\r \"&'<=>`".split("")],
            ["\0	\n\f\r \"&'<=>`".split(""), "\0	\n\f\r \"&'<=>`".split("")],
          ],
          single: [
            ["&'".split(""), "\"&'`".split("")],
            ["\0&'".split(""), "\0\"&'`".split("")],
          ],
          double: [
            ['"&'.split(""), "\"&'`".split("")],
            ['\0"&'.split(""), "\0\"&'`".split("")],
          ],
        },
        tk = new Set(["desc", "foreignObject", "title"]),
        tw = ["<", "&"];
      function tC(e, t, r, n) {
        return r &&
          "element" === r.type &&
          ("script" === r.tagName || "style" === r.tagName)
          ? e.value
          : e7(
              e.value,
              Object.assign({}, n.settings.characterReferences, { subset: tw }),
            );
      }
      let tS = (0, eX.f)("type", {
          invalid: function (e) {
            throw Error("Expected node, not `" + e + "`");
          },
          unknown: function (e) {
            throw Error("Cannot compile unknown node `" + e.type + "`");
          },
          handlers: {
            comment: function (e, t, r, n) {
              return n.settings.bogusComments
                ? "<?" +
                    e7(
                      e.value,
                      Object.assign({}, n.settings.characterReferences, {
                        subset: tt,
                      }),
                    ) +
                    ">"
                : "<!--" +
                    e.value.replace(te, function (e) {
                      return e7(
                        e,
                        Object.assign({}, n.settings.characterReferences, {
                          subset: tr,
                        }),
                      );
                    }) +
                    "-->";
            },
            doctype: function (e, t, r, n) {
              return (
                "<!" +
                (n.settings.upperDoctype ? "DOCTYPE" : "doctype") +
                (n.settings.tightDoctype ? "" : " ") +
                "html>"
              );
            },
            element: function (e, t, r, n) {
              let { schema: s } = n,
                a = "svg" !== s.space && n.settings.omitOptionalTags,
                i =
                  "svg" === s.space
                    ? n.settings.closeEmptyElements
                    : n.settings.voids.includes(e.tagName.toLowerCase()),
                o = [];
              "html" === s.space && "svg" === e.tagName && (n.schema = eV.V);
              let l = (function (e, t) {
                let r,
                  n = [],
                  s = -1;
                if (t) {
                  for (r in t)
                    if (null !== t[r] && void 0 !== t[r]) {
                      let s = (function (e, t, r) {
                        let n,
                          s = (0, ta.f)(e.schema, t),
                          a =
                            e.settings.allowParseErrors &&
                            "html" === e.schema.space
                              ? 0
                              : 1,
                          i = +!e.settings.allowDangerousCharacters;
                        if (
                          (s.overloadedBoolean &&
                          (r === s.attribute || "" === r)
                            ? (r = !0)
                            : (s.boolean || s.overloadedBoolean) &&
                              ("string" != typeof r ||
                                r === s.attribute ||
                                "" === r) &&
                              (r = !!r),
                          null == r ||
                            !1 === r ||
                            ("number" == typeof r && Number.isNaN(r)))
                        )
                          return "";
                        let o = e7(
                          s.attribute,
                          Object.assign({}, e.settings.characterReferences, {
                            subset: t_.name[a][i],
                          }),
                        );
                        if (
                          !0 === r ||
                          ((r = Array.isArray(r)
                            ? (s.commaSeparated ? ts.b : ti.b)(r, {
                                padLeft: !e.settings.tightCommaSeparatedLists,
                              })
                            : String(r)),
                          e.settings.collapseEmptyAttributes && !r)
                        )
                          return o;
                        if (
                          (e.settings.preferUnquoted &&
                            (n = e7(
                              r,
                              Object.assign(
                                {},
                                e.settings.characterReferences,
                                { attribute: !0, subset: t_.unquoted[a][i] },
                              ),
                            )),
                          n !== r)
                        ) {
                          let { quote: t } = e;
                          (e.settings.quoteSmart &&
                            (0, tn.f)(r, t) > (0, tn.f)(r, e.alternative) &&
                            (t = e.alternative),
                            (n =
                              t +
                              e7(
                                r,
                                Object.assign(
                                  {},
                                  e.settings.characterReferences,
                                  {
                                    subset: ("'" === t ? t_.single : t_.double)[
                                      a
                                    ][i],
                                    attribute: !0,
                                  },
                                ),
                              ) +
                              t));
                        }
                        return o + (n ? "=" + n : n);
                      })(e, r, t[r]);
                      s && n.push(s);
                    }
                }
                for (; ++s < n.length;) {
                  let t = e.settings.tightAttributes
                    ? n[s].charAt(n[s].length - 1)
                    : void 0;
                  s !== n.length - 1 && '"' !== t && "'" !== t && (n[s] += " ");
                }
                return n.join("");
              })(n, e.properties);
              "svg" === n.schema.space &&
                tk.has(e.tagName) &&
                (n.schema = eV.c);
              let c = n.all(
                "html" === s.space && "template" === e.tagName ? e.content : e,
              );
              if (((n.schema = s), c && (i = !1), l || !a || !tb(e, t, r))) {
                if (
                  (o.push("<", e.tagName, l ? " " + l : ""),
                  i && ("svg" === s.space || n.settings.closeSelfClosing))
                ) {
                  let e = l.charAt(l.length - 1);
                  ((!n.settings.tightSelfClosing ||
                    "/" === e ||
                    (e && '"' !== e && "'" !== e)) &&
                    o.push(" "),
                    o.push("/"));
                }
                o.push(">");
              }
              return (
                o.push(c),
                i || (a && tg(e, t, r)) || o.push("</" + e.tagName + ">"),
                o.join("")
              );
            },
            raw: function (e, t, r, n) {
              return n.settings.allowDangerousHtml ? e.value : tC(e, t, r, n);
            },
            root: function (e, t, r, n) {
              return n.all(e);
            },
            text: tC,
          },
        }),
        tx = {},
        tv = {},
        tA = [];
      function tN(e, t, r) {
        return tS(e, t, r, this);
      }
      function tE(e) {
        let t = [],
          r = (e && e.children) || tA,
          n = -1;
        for (; ++n < r.length;) t[n] = this.one(r[n], n, e);
        return t.join("");
      }
      let tI = /\s+/g;
      function t$(e, t) {
        if (!t) return e;
        for (let r of ((e.properties ||= {}),
        (e.properties.class ||= []),
        "string" == typeof e.properties.class &&
          (e.properties.class = e.properties.class.split(tI)),
        Array.isArray(e.properties.class) || (e.properties.class = []),
        Array.isArray(t) ? t : t.split(tI)))
          r && !e.properties.class.includes(r) && e.properties.class.push(r);
        return e;
      }
      let tL = /:?lang=["']([^"']+)["']/g,
        tP = /(?:```|~~~)([\w-]+)/g,
        tR = /\\begin\{([\w-]+)\}/g,
        tT = /<script\s+(?:type|lang)=["']([^"']+)["']/gi,
        tM = /^\s*---\r?\n[\s\S]*?\r?\n---(?:\r?\n|\s*$)/,
        tG = ["color", "background-color"];
      function tB(e) {
        let t = {};
        if (
          (e.color && (t.color = e.color),
          e.bgColor && (t["background-color"] = e.bgColor),
          e.fontStyle)
        ) {
          (e.fontStyle & y.Italic && (t["font-style"] = "italic"),
            e.fontStyle & y.Bold && (t["font-weight"] = "bold"));
          let r = [];
          (e.fontStyle & y.Underline && r.push("underline"),
            e.fontStyle & y.Strikethrough && r.push("line-through"),
            r.length && (t["text-decoration"] = r.join(" ")));
        }
        return t;
      }
      function tO(e) {
        return "string" == typeof e
          ? e
          : Object.entries(e)
              .map(([e, t]) => `${e}:${t}`)
              .join(";");
      }
      let tF = [
        (function () {
          let e = new WeakMap();
          function t(t) {
            if (!e.has(t.meta)) {
              var r;
              let a,
                i,
                o,
                l =
                  ((i = (a = ex((r = t.source), !0)).map(([e]) => e)),
                  (o = a.map(([, e]) => e)),
                  {
                    lines: i,
                    indexToPos: function (e) {
                      if (e === r.length)
                        return {
                          line: i.length - 1,
                          character: i.at(-1).length,
                        };
                      let t = 0,
                        n = i.length - 1;
                      for (; t < n;) {
                        let r = (t + n + 1) >>> 1;
                        o[r] <= e ? (t = r) : (n = r - 1);
                      }
                      return { line: t, character: e - o[t] };
                    },
                    posToIndex: function (e, t) {
                      return o[e] + t;
                    },
                  });
              function n(e) {
                if ("number" == typeof e) {
                  if (e < 0 || e > t.source.length)
                    throw new s(
                      `Invalid decoration offset: ${e}. Code length: ${t.source.length}`,
                    );
                  return { ...l.indexToPos(e), offset: e };
                }
                {
                  let t = l.lines[e.line];
                  if (void 0 === t)
                    throw new s(
                      `Invalid decoration position ${JSON.stringify(e)}. Lines length: ${l.lines.length}`,
                    );
                  let r = e.character;
                  if ((r < 0 && (r = t.length + r), r < 0 || r > t.length))
                    throw new s(
                      `Invalid decoration position ${JSON.stringify(e)}. Line ${e.line} length: ${t.length}`,
                    );
                  return {
                    ...e,
                    character: r,
                    offset: l.posToIndex(e.line, r),
                  };
                }
              }
              let c = (t.options.decorations || []).map((e) => ({
                ...e,
                start: n(e.start),
                end: n(e.end),
              }));
              ((function (e) {
                if (
                  !(function (e) {
                    let t = [],
                      r = new Map(),
                      n = new Map();
                    for (let s = 0; s < e.length; s++) {
                      let { start: a, end: i } = e[s];
                      if (a.offset > i.offset) return !1;
                      a.offset !== i.offset &&
                        (t.push(e[s]),
                        r.has(a.offset) || r.set(a.offset, s),
                        n.set(i.offset, s));
                    }
                    for (let t = 0; t < e.length; t++) {
                      let { start: s, end: a } = e[t];
                      if (
                        s.offset === a.offset &&
                        ((r.get(s.offset) ?? t) < t ||
                          (n.get(s.offset) ?? t) > t)
                      )
                        return !1;
                    }
                    t.sort(
                      (e, t) =>
                        e.start.offset - t.start.offset ||
                        t.end.offset - e.end.offset,
                    );
                    let s = [];
                    for (let { start: e, end: r } of t) {
                      for (; s.length && s.at(-1) <= e.offset;) s.pop();
                      if (s.length && r.offset > s.at(-1)) return !1;
                      s.push(r.offset);
                    }
                    return !0;
                  })(e)
                )
                  for (let t = 0; t < e.length; t++) {
                    let r = e[t];
                    if (r.start.offset > r.end.offset)
                      throw new s(
                        `Invalid decoration range: ${JSON.stringify(r.start)} - ${JSON.stringify(r.end)}`,
                      );
                    for (let n = t + 1; n < e.length; n++) {
                      let t = e[n],
                        a =
                          r.start.offset <= t.start.offset &&
                          t.start.offset < r.end.offset,
                        i =
                          r.start.offset < t.end.offset &&
                          t.end.offset <= r.end.offset,
                        o =
                          t.start.offset <= r.start.offset &&
                          r.start.offset < t.end.offset,
                        l =
                          t.start.offset < r.end.offset &&
                          r.end.offset <= t.end.offset;
                      if (a || i || o || l) {
                        if (
                          (a && i) ||
                          (o && l) ||
                          (o && r.start.offset === r.end.offset) ||
                          (i && t.start.offset === t.end.offset)
                        )
                          continue;
                        throw new s(
                          `Decorations ${JSON.stringify(r.start)} and ${JSON.stringify(t.start)} intersect.`,
                        );
                      }
                    }
                  }
              })(c),
                e.set(t.meta, {
                  decorations: c,
                  converter: l,
                  source: t.source,
                }));
            }
            return e.get(t.meta);
          }
          return {
            name: "shiki:decorations",
            tokens(e) {
              if (this.options.decorations?.length) {
                var r;
                let n;
                return (n = [
                  ...((r = t(this).decorations.flatMap((e) => [
                    e.start.offset,
                    e.end.offset,
                  ])) instanceof Set
                    ? r
                    : new Set(r)),
                ].sort((e, t) => e - t)).length
                  ? e.map((e) =>
                      e.flatMap((e) => {
                        let t = e.offset + e.content.length,
                          r = (function (e, t) {
                            let r = 0,
                              n = e.length;
                            for (; r < n;) {
                              let s = r + ((n - r) >> 1);
                              e[s] <= t ? (r = s + 1) : (n = s);
                            }
                            return r;
                          })(n, e.offset),
                          s = r;
                        for (; s < n.length && n[s] < t;) s++;
                        if (r === s) return e;
                        let a = n.slice(r, s);
                        for (let t = 0; t < a.length; t++) a[t] -= e.offset;
                        let i = 0,
                          o = [];
                        for (let t of a)
                          (t > i &&
                            o.push({
                              ...e,
                              content: e.content.slice(i, t),
                              offset: e.offset + i,
                            }),
                            (i = t));
                        return (
                          i < e.content.length &&
                            o.push({
                              ...e,
                              content: e.content.slice(i),
                              offset: e.offset + i,
                            }),
                          o
                        );
                      }),
                    )
                  : e;
              }
            },
            code(e) {
              if (!this.options.decorations?.length) return;
              let r = t(this),
                n = [...e.children].filter(
                  (e) => "element" === e.type && "span" === e.tagName,
                );
              if (n.length !== r.converter.lines.length)
                throw new s(
                  `Number of lines in code element (${n.length}) does not match the number of lines in the source (${r.converter.lines.length}). Failed to apply decorations.`,
                );
              function a(e, t, r, a) {
                let o = n[e],
                  l = "",
                  c = -1,
                  u = -1;
                if (
                  (0 === t && (c = 0),
                  0 === r && (u = 0),
                  1 / 0 === r && (u = o.children.length),
                  -1 === c || -1 === u)
                )
                  for (let e = 0; e < o.children.length; e++)
                    ((l += (function e(t) {
                      return "text" === t.type
                        ? t.value
                        : "element" === t.type
                          ? t.children.map(e).join("")
                          : "";
                    })(o.children[e])),
                      -1 === c && l.length === t && (c = e + 1),
                      -1 === u && l.length === r && (u = e + 1));
                if (-1 === c)
                  throw new s(
                    `Failed to find start index for decoration ${JSON.stringify(a.start)}`,
                  );
                if (-1 === u)
                  throw new s(
                    `Failed to find end index for decoration ${JSON.stringify(a.end)}`,
                  );
                let h = o.children.slice(c, u);
                if (a.alwaysWrap || h.length !== o.children.length)
                  if (
                    a.alwaysWrap ||
                    1 !== h.length ||
                    "element" !== h[0].type
                  ) {
                    let e = {
                      type: "element",
                      tagName: "span",
                      properties: {},
                      children: h,
                    };
                    (i(e, a, "wrapper"), o.children.splice(c, h.length, e));
                  } else i(h[0], a, "token");
                else i(o, a, "line");
              }
              function i(e, t, r) {
                let n = t.properties || {},
                  s = t.transform || ((e) => e);
                return (
                  (e.tagName = t.tagName || "span"),
                  (e.properties = {
                    ...e.properties,
                    ...n,
                    class: e.properties.class,
                  }),
                  t.properties?.class && t$(e, t.properties.class),
                  (e = s(e, r) || e)
                );
              }
              let o = [];
              for (let e of r.decorations.sort(
                (e, t) =>
                  t.start.offset - e.start.offset ||
                  e.end.offset - t.end.offset,
              )) {
                let { start: t, end: r } = e;
                if (t.line === r.line) a(t.line, t.character, r.character, e);
                else if (t.line < r.line) {
                  a(t.line, t.character, 1 / 0, e);
                  for (let s = t.line + 1; s < r.line; s++)
                    o.push(() => {
                      var t;
                      n[(t = s)] = i(n[t], e, "line");
                    });
                  a(r.line, 0, r.character, e);
                }
              }
              for (let e = o.length - 1; e >= 0; e--) o[e]();
            },
          };
        })(),
      ];
      function tD(e) {
        let t = (function (e) {
          let t = [],
            r = [],
            n = [];
          for (let s of e)
            switch (s.enforce) {
              case "pre":
                t.push(s);
                break;
              case "post":
                r.push(s);
                break;
              default:
                n.push(s);
            }
          return { pre: t, post: r, normal: n };
        })(e.transformers || []);
        return [...t.pre, ...t.normal, ...t.post, ...tF];
      }
      var tj = [
          "black",
          "red",
          "green",
          "yellow",
          "blue",
          "magenta",
          "cyan",
          "white",
          "brightBlack",
          "brightRed",
          "brightGreen",
          "brightYellow",
          "brightBlue",
          "brightMagenta",
          "brightCyan",
          "brightWhite",
        ],
        tU = {
          1: "bold",
          2: "dim",
          3: "italic",
          4: "underline",
          7: "reverse",
          8: "hidden",
          9: "strikethrough",
        };
      function tW(e) {
        let t = e.shift();
        if ("2" === t) {
          let t = e.splice(0, 3).map((e) => Number.parseInt(e));
          if (3 !== t.length || t.some((e) => Number.isNaN(e))) return;
          return { type: "rgb", rgb: t };
        }
        if ("5" === t) {
          let t = e.shift();
          if (t) return { type: "table", index: Number(t) };
        }
      }
      var tq = {
        black: "#000000",
        red: "#bb0000",
        green: "#00bb00",
        yellow: "#bbbb00",
        blue: "#0000bb",
        magenta: "#ff00ff",
        cyan: "#00bbbb",
        white: "#eeeeee",
        brightBlack: "#555555",
        brightRed: "#ff5555",
        brightGreen: "#00ff00",
        brightYellow: "#ffff55",
        brightBlue: "#5555ff",
        brightMagenta: "#ff55ff",
        brightCyan: "#55ffff",
        brightWhite: "#ffffff",
      };
      let tz = /#([0-9a-f]{3,8})/i,
        tH = /var\((--[\w-]+-ansi-[\w-]+)\)/,
        tV = {
          black: "#000000",
          red: "#cd3131",
          green: "#0DBC79",
          yellow: "#E5E510",
          blue: "#2472C8",
          magenta: "#BC3FBC",
          cyan: "#11A8CD",
          white: "#E5E5E5",
          brightBlack: "#666666",
          brightRed: "#F14C4C",
          brightGreen: "#23D18B",
          brightYellow: "#F5F543",
          brightBlue: "#3B8EEA",
          brightMagenta: "#D670D6",
          brightCyan: "#29B8DB",
          brightWhite: "#FFFFFF",
        };
      function tX(e, t, r = {}) {
        let n = e.resolveLangAlias(r.lang || "text"),
          { theme: s = e.getLoadedThemes()[0] } = r;
        if (!ek(n) && !eC(s) && "ansi" === n) {
          let n,
            a,
            i,
            o,
            l,
            c,
            u,
            { theme: h } = e.setTheme(s);
          return (
            (n = ey(h, r)),
            (a = ex(t)),
            (i = (function (e = tq) {
              let t;
              function r(e) {
                return `#${e.map((e) => Math.max(0, Math.min(e, 255)).toString(16).padStart(2, "0")).join("")}`;
              }
              return {
                value: function (n) {
                  switch (n.type) {
                    case "named":
                      return e[n.name];
                    case "rgb":
                      return r(n.rgb);
                    case "table":
                      var s;
                      return (
                        (s = n.index),
                        (function () {
                          if (t) return t;
                          t = [];
                          for (let r = 0; r < tj.length; r++) t.push(e[tj[r]]);
                          let n = [0, 95, 135, 175, 215, 255];
                          for (let e = 0; e < 6; e++)
                            for (let s = 0; s < 6; s++)
                              for (let a = 0; a < 6; a++)
                                t.push(r([n[e], n[s], n[a]]));
                          let s = 8;
                          for (let e = 0; e < 24; e++, s += 10)
                            t.push(r([s, s, s]));
                          return t;
                        })()[s]
                      );
                  }
                },
              };
            })(
              Object.fromEntries(
                tj.map((e) => {
                  let t = `terminal.ansi${e[0].toUpperCase()}${e.substring(1)}`;
                  return [e, h.colors?.[t] || tV[e]];
                }),
              ),
            )),
            (o = null),
            (l = null),
            (c = new Set()),
            (u = {
              parse(e) {
                let t = [],
                  r = 0;
                do {
                  let n = (function (e, t) {
                      let r = e.indexOf("\x1b", t);
                      if (-1 !== r && "[" === e[r + 1]) {
                        let t = e.indexOf("m", r);
                        if (-1 !== t)
                          return {
                            sequence: e.substring(r + 2, t).split(";"),
                            startPosition: r,
                            position: t + 1,
                          };
                      }
                      return { position: e.length };
                    })(e, r),
                    s = n.sequence
                      ? e.substring(r, n.startPosition)
                      : e.substring(r);
                  if (
                    (s.length > 0 &&
                      t.push({
                        value: s,
                        foreground: o,
                        background: l,
                        decorations: new Set(c),
                      }),
                    n.sequence)
                  ) {
                    let e = (function (e) {
                      let t = [];
                      for (; e.length > 0;) {
                        let r = e.shift();
                        if (!r) continue;
                        let n = Number.parseInt(r);
                        if (!Number.isNaN(n))
                          if (0 === n) t.push({ type: "resetAll" });
                          else if (n <= 9)
                            tU[n] &&
                              t.push({ type: "setDecoration", value: tU[n] });
                          else if (n <= 29) {
                            let e = tU[n - 20];
                            e &&
                              (t.push({ type: "resetDecoration", value: e }),
                              "dim" === e &&
                                t.push({
                                  type: "resetDecoration",
                                  value: "bold",
                                }));
                          } else if (n <= 37)
                            t.push({
                              type: "setForegroundColor",
                              value: { type: "named", name: tj[n - 30] },
                            });
                          else if (38 === n) {
                            let r = tW(e);
                            r &&
                              t.push({ type: "setForegroundColor", value: r });
                          } else if (39 === n)
                            t.push({ type: "resetForegroundColor" });
                          else if (n <= 47)
                            t.push({
                              type: "setBackgroundColor",
                              value: { type: "named", name: tj[n - 40] },
                            });
                          else if (48 === n) {
                            let r = tW(e);
                            r &&
                              t.push({ type: "setBackgroundColor", value: r });
                          } else
                            49 === n
                              ? t.push({ type: "resetBackgroundColor" })
                              : 53 === n
                                ? t.push({
                                    type: "setDecoration",
                                    value: "overline",
                                  })
                                : 55 === n
                                  ? t.push({
                                      type: "resetDecoration",
                                      value: "overline",
                                    })
                                  : n >= 90 && n <= 97
                                    ? t.push({
                                        type: "setForegroundColor",
                                        value: {
                                          type: "named",
                                          name: tj[n - 90 + 8],
                                        },
                                      })
                                    : n >= 100 &&
                                      n <= 107 &&
                                      t.push({
                                        type: "setBackgroundColor",
                                        value: {
                                          type: "named",
                                          name: tj[n - 100 + 8],
                                        },
                                      });
                      }
                      return t;
                    })(n.sequence);
                    for (let t of e)
                      "resetAll" === t.type
                        ? ((o = null), (l = null), c.clear())
                        : "resetForegroundColor" === t.type
                          ? (o = null)
                          : "resetBackgroundColor" === t.type
                            ? (l = null)
                            : "resetDecoration" === t.type && c.delete(t.value);
                    for (let t of e)
                      "setForegroundColor" === t.type
                        ? (o = t.value)
                        : "setBackgroundColor" === t.type
                          ? (l = t.value)
                          : "setDecoration" === t.type && c.add(t.value);
                  }
                  r = n.position;
                } while (r < e.length);
                return t;
              },
            }),
            a.map((e) =>
              u.parse(e[0]).map((t) => {
                let r, s;
                (t.decorations.has("reverse")
                  ? ((r = t.background ? i.value(t.background) : h.bg),
                    (s = t.foreground ? i.value(t.foreground) : h.fg))
                  : ((r = t.foreground ? i.value(t.foreground) : h.fg),
                    (s = t.background ? i.value(t.background) : void 0)),
                  (r = eb(r, n)),
                  (s = eb(s, n)),
                  t.decorations.has("dim") &&
                    (r = (function (e) {
                      let t = e.match(tz);
                      if (t) {
                        let e = t[1];
                        if (8 === e.length) {
                          let t = Math.round(
                            Number.parseInt(e.slice(6, 8), 16) / 2,
                          )
                            .toString(16)
                            .padStart(2, "0");
                          return `#${e.slice(0, 6)}${t}`;
                        }
                        if (6 === e.length) return `#${e}80`;
                        if (4 === e.length) {
                          let t = e[0],
                            r = e[1],
                            n = e[2],
                            s = e[3];
                          return `#${t}${t}${r}${r}${n}${n}${Math.round(
                            Number.parseInt(`${s}${s}`, 16) / 2,
                          )
                            .toString(16)
                            .padStart(2, "0")}`;
                        } else if (3 === e.length) {
                          let t = e[0],
                            r = e[1],
                            n = e[2];
                          return `#${t}${t}${r}${r}${n}${n}80`;
                        }
                      }
                      let r = e.match(tH);
                      return r ? `var(${r[1]}-dim)` : e;
                    })(r)));
                let a = y.None;
                return (
                  t.decorations.has("bold") && (a |= y.Bold),
                  t.decorations.has("italic") && (a |= y.Italic),
                  t.decorations.has("underline") && (a |= y.Underline),
                  t.decorations.has("strikethrough") && (a |= y.Strikethrough),
                  {
                    content: t.value,
                    offset: e[1],
                    color: r,
                    bgColor: s,
                    fontStyle: a,
                  }
                );
              }),
            )
          );
        }
        return ej(e, t, r);
      }
      function tQ(e, t, r) {
        let n, a, i, o, l, c;
        if ("themes" in r) {
          let {
              defaultColor: u = "light",
              cssVariablePrefix: h = "--shiki-",
              colorsRendering: p = "css-vars",
            } = r,
            d = Object.entries(r.themes)
              .filter((e) => e[1])
              .map((e) => ({ color: e[0], theme: e[1] }))
              .sort((e, t) => (e.color === u ? -1 : +(t.color === u)));
          if (0 === d.length) throw new s("`themes` option must not be empty");
          let g = ez(e, t, r, tX);
          if (
            ((c = eB(g)),
            u && "light-dark()" !== u && !d.some((e) => e.color === u))
          )
            throw new s(
              `\`themes\` option must contain the defaultColor key \`${u}\``,
            );
          let f = d.map((t) => e.getTheme(t.theme)),
            m = d.map((e) => e.color);
          ((i = g.map((e) =>
            e.map((e) =>
              (function (e, t, r, n, a = "css-vars") {
                let i = {
                    content: e.content,
                    explanation: e.explanation,
                    offset: e.offset,
                  },
                  o = t.map((t) => tB(e.variants[t])),
                  l = new Set(o.flatMap((e) => Object.keys(e))),
                  c = {},
                  u = (e, n) => {
                    let s =
                      "color" === n
                        ? ""
                        : "background-color" === n
                          ? "-bg"
                          : `-${n}`;
                    return r + t[e] + ("color" === n ? "" : s);
                  };
                return (
                  o.forEach((e, r) => {
                    for (let i of l) {
                      let l = e[i] || "inherit";
                      if (0 === r && n && tG.includes(i))
                        if ("light-dark()" === n && o.length > 1) {
                          let e = t.findIndex((e) => "light" === e),
                            n = t.findIndex((e) => "dark" === e);
                          if (-1 === e || -1 === n)
                            throw new s(
                              'When using `defaultColor: "light-dark()"`, you must provide both `light` and `dark` themes',
                            );
                          let h = o[e][i] || "inherit",
                            p = o[n][i] || "inherit";
                          ((c[i] = `light-dark(${h}, ${p})`),
                            "css-vars" === a && (c[u(r, i)] = l));
                        } else c[i] = l;
                      else "css-vars" === a && (c[u(r, i)] = l);
                    }
                  }),
                  (i.htmlStyle = c),
                  i
                );
              })(e, m, h, u, p),
            ),
          )),
            c && eG(i, c));
          let y = d.map((e) => ey(e.theme, r));
          ((a = tZ(d, f, y, h, u, "fg", p)),
            (n = tZ(d, f, y, h, u, "bg", p)),
            (o = `shiki-themes ${f.map((e) => e.name).join(" ")}`),
            (l = u ? void 0 : [a, n].join(";")));
        } else if ("theme" in r) {
          let s = ey(r.theme, r);
          i = tX(e, t, r);
          let l = e.getTheme(r.theme);
          ((n = eb(l.bg, s)), (a = eb(l.fg, s)), (o = l.name), (c = eB(i)));
        } else
          throw new s(
            "Invalid options, either `theme` or `themes` must be provided",
          );
        return {
          tokens: i,
          fg: a,
          bg: n,
          themeName: o,
          rootStyle: l,
          grammarState: c,
        };
      }
      function tZ(e, t, r, n, a, i, o) {
        return e
          .map((l, c) => {
            let u = eb(t[c][i], r[c]) || "inherit",
              h = `${n + l.color}${"bg" === i ? "-bg" : ""}:${u}`;
            if (0 === c && a) {
              if ("light-dark()" === a && e.length > 1) {
                let n = e.findIndex((e) => "light" === e.color),
                  a = e.findIndex((e) => "dark" === e.color);
                if (-1 === n || -1 === a)
                  throw new s(
                    'When using `defaultColor: "light-dark()"`, you must provide both `light` and `dark` themes',
                  );
                return `light-dark(${eb(t[n][i], r[n]) || "inherit"}, ${eb(t[a][i], r[a]) || "inherit"});${h}`;
              }
              return u;
            }
            return "css-vars" === o ? h : null;
          })
          .filter((e) => !!e)
          .join(";");
      }
      let tK = /^\s+$/,
        tY = /^(\s*)(.*?)(\s*)$/;
      function tJ(
        e,
        t,
        r,
        n = {
          meta: {},
          options: r,
          codeToHast: (t, r) => tJ(e, t, r),
          codeToTokens: (t, r) => tQ(e, t, r),
        },
      ) {
        let s = t;
        for (let e of tD(r)) s = e.preprocess?.call(n, s, r) || s;
        let {
            tokens: a,
            fg: i,
            bg: o,
            themeName: l,
            rootStyle: c,
            grammarState: u,
          } = tQ(e, s, r),
          { mergeWhitespaces: h = !0, mergeSameStyleTokens: p = !1 } = r;
        (!0 === h
          ? (a = a.map((e) => {
              let t,
                r = [],
                n = "";
              return (
                e.forEach((s, a) => {
                  let i = !(
                    s.fontStyle &&
                    (s.fontStyle & y.Underline || s.fontStyle & y.Strikethrough)
                  );
                  i && tK.test(s.content) && e[a + 1]
                    ? (void 0 === t && (t = s.offset), (n += s.content))
                    : n
                      ? (i
                          ? r.push({ ...s, offset: t, content: n + s.content })
                          : r.push({ content: n, offset: t }, s),
                        (t = void 0),
                        (n = ""))
                      : r.push(s);
                }),
                r
              );
            }))
          : "never" === h &&
            (a = a.map((e) =>
              e.flatMap((e) => {
                if (tK.test(e.content)) return e;
                let t = e.content.match(tY);
                if (!t) return e;
                let [, r, n, s] = t;
                if (!r && !s) return e;
                let a = [{ ...e, offset: e.offset + r.length, content: n }];
                return (
                  r && a.unshift({ content: r, offset: e.offset }),
                  s &&
                    a.push({
                      content: s,
                      offset: e.offset + r.length + n.length,
                    }),
                  a
                );
              }),
            )),
          p &&
            (a = a.map((e) => {
              let t = [];
              for (let r of e) {
                if (0 === t.length) {
                  t.push({ ...r });
                  continue;
                }
                let e = t.at(-1),
                  n = tO(e.htmlStyle || tB(e)),
                  s = tO(r.htmlStyle || tB(r)),
                  a =
                    e.fontStyle &&
                    (e.fontStyle & y.Underline ||
                      e.fontStyle & y.Strikethrough),
                  i =
                    r.fontStyle &&
                    (r.fontStyle & y.Underline ||
                      r.fontStyle & y.Strikethrough);
                a || i || n !== s ? t.push({ ...r }) : (e.content += r.content);
              }
              return t;
            })));
        let d = {
          ...n,
          get source() {
            return s;
          },
        };
        for (let e of tD(r)) a = e.tokens?.call(d, a) || a;
        return (function (e, t, r, n = eB(e)) {
          let s = tD(t),
            a = [],
            i = { type: "root", children: [] },
            { structure: o = "classic", tabindex: l = "0" } = t,
            c = { class: `shiki ${t.themeName || ""}` };
          for (let [e, r] of (!1 !== t.rootStyle &&
            (null != t.rootStyle
              ? (c.style = t.rootStyle)
              : (c.style = `background-color:${t.bg};color:${t.fg}`)),
          !1 !== l && null != l && (c.tabindex = l.toString()),
          Object.entries(t.meta || {})))
            e.startsWith("_") || (c[e] = r);
          let u = {
              type: "element",
              tagName: "pre",
              properties: c,
              children: [],
              data: t.data,
            },
            h = {
              type: "element",
              tagName: "code",
              properties: {},
              children: a,
            },
            p = [],
            d = {
              ...r,
              structure: o,
              addClassToHast: t$,
              get source() {
                return r.source;
              },
              get tokens() {
                return e;
              },
              get options() {
                return t;
              },
              get root() {
                return i;
              },
              get pre() {
                return u;
              },
              get code() {
                return h;
              },
              get lines() {
                return p;
              },
            };
          if (
            (e.forEach((e, t) => {
              t &&
                ("inline" === o
                  ? i.children.push({
                      type: "element",
                      tagName: "br",
                      properties: {},
                      children: [],
                    })
                  : "classic" === o && a.push({ type: "text", value: "\n" }));
              let r = {
                  type: "element",
                  tagName: "span",
                  properties: { class: "line" },
                  children: [],
                },
                n = 0;
              for (let a of e) {
                let e = {
                    type: "element",
                    tagName: "span",
                    properties: { ...a.htmlAttrs },
                    children: [{ type: "text", value: a.content }],
                  },
                  l = tO(a.htmlStyle || tB(a));
                for (let i of (l && (e.properties.style = l), s))
                  e = i?.span?.call(d, e, t + 1, n, r, a) || e;
                ("inline" === o
                  ? i.children.push(e)
                  : "classic" === o && r.children.push(e),
                  (n += a.content.length));
              }
              if ("classic" === o) {
                for (let e of s) r = e?.line?.call(d, r, t + 1) || r;
                (p.push(r), a.push(r));
              } else "inline" === o && p.push(r);
            }),
            "classic" === o)
          ) {
            for (let e of s) h = e?.code?.call(d, h) || h;
            for (let e of (u.children.push(h), s)) u = e?.pre?.call(d, u) || u;
            i.children.push(u);
          } else if ("inline" === o) {
            let e = [],
              t = {
                type: "element",
                tagName: "span",
                properties: { class: "line" },
                children: [],
              };
            for (let r of i.children)
              "element" === r.type && "br" === r.tagName
                ? (e.push(t),
                  (t = {
                    type: "element",
                    tagName: "span",
                    properties: { class: "line" },
                    children: [],
                  }))
                : ("element" === r.type || "text" === r.type) &&
                  t.children.push(r);
            e.push(t);
            let r = {
              type: "element",
              tagName: "code",
              properties: {},
              children: e,
            };
            for (let e of s) r = e?.code?.call(d, r) || r;
            i.children = [];
            for (let e = 0; e < r.children.length; e++) {
              e > 0 &&
                i.children.push({
                  type: "element",
                  tagName: "br",
                  properties: {},
                  children: [],
                });
              let t = r.children[e];
              "element" === t.type && i.children.push(...t.children);
            }
          }
          let g = i;
          for (let e of s) g = e?.root?.call(d, g) || g;
          return (n && eG(g, n), g);
        })(
          a,
          {
            ...r,
            fg: i,
            bg: o,
            themeName: l,
            rootStyle: !1 !== r.rootStyle && (r.rootStyle ?? c),
          },
          d,
          u,
        );
      }
      let t0 = function (e, t) {
        let r = t || tx,
          n = r.quote || '"';
        if ('"' !== n && "'" !== n)
          throw Error("Invalid quote `" + n + "`, expected `'` or `\"`");
        return {
          one: tN,
          all: tE,
          settings: {
            omitOptionalTags: r.omitOptionalTags || !1,
            allowParseErrors: r.allowParseErrors || !1,
            allowDangerousCharacters: r.allowDangerousCharacters || !1,
            quoteSmart: r.quoteSmart || !1,
            preferUnquoted: r.preferUnquoted || !1,
            tightAttributes: r.tightAttributes || !1,
            upperDoctype: r.upperDoctype || !1,
            tightDoctype: r.tightDoctype || !1,
            bogusComments: r.bogusComments || !1,
            tightCommaSeparatedLists: r.tightCommaSeparatedLists || !1,
            tightSelfClosing: r.tightSelfClosing || !1,
            collapseEmptyAttributes: r.collapseEmptyAttributes || !1,
            allowDangerousHtml: r.allowDangerousHtml || !1,
            voids: r.voids || eH.f,
            characterReferences: r.characterReferences || tv,
            closeSelfClosing: r.closeSelfClosing || !1,
            closeEmptyElements: r.closeEmptyElements || !1,
          },
          schema: "svg" === r.space ? eV.V : eV.c,
          quote: n,
          alternative: '"' === n ? "'" : '"',
        }.one(
          Array.isArray(e) ? { type: "root", children: e } : e,
          void 0,
          void 0,
        );
      };
      function t1(e, t, r) {
        let n = {
            meta: {},
            options: r,
            codeToHast: (t, r) => tJ(e, t, r),
            codeToTokens: (t, r) => tQ(e, t, r),
          },
          s = t0(tJ(e, t, r, n));
        for (let e of tD(r)) s = e.postprocess?.call(n, s, r) || s;
        return s;
      }
      async function t2(e) {
        let t = await eT(e);
        return {
          getLastGrammarState: (...e) => eU(t, ...e),
          codeToTokensBase: (e, r) => tX(t, e, r),
          codeToTokensWithThemes: (e, r) => ez(t, e, r),
          codeToTokens: (e, r) => tQ(t, e, r),
          codeToHast: (e, r) => tJ(t, e, r),
          codeToHtml: (e, r) => t1(t, e, r),
          getBundledLanguages: () => ({}),
          getBundledThemes: () => ({}),
          ...t,
          getInternalContext: () => t,
        };
      }
      function t3(e, t) {
        return {
          index: e,
          captureIndices: t.map((e) =>
            null == e
              ? { start: 0xffffffff, end: 0xffffffff, length: 0 }
              : { start: e[0], end: e[1], length: e[1] - e[0] },
          ),
        };
      }
      e.s(
        [
          "j",
          0,
          function (e) {
            let t = e.langs,
              r = e.themes,
              n = e.engine;
            return async function (e) {
              function a(r) {
                if ("string" == typeof r) {
                  if (ew((r = e.langAlias?.[r] || r))) return [];
                  let n = t[r];
                  if (!n)
                    throw new s(
                      `Language \`${r}\` is not included in this bundle. You may want to load it from external source.`,
                    );
                  return n;
                }
                return r;
              }
              function i(e) {
                if (eC(e)) return "none";
                if ("string" == typeof e) {
                  let t = r[e];
                  if (!t)
                    throw new s(
                      `Theme \`${e}\` is not included in this bundle. You may want to load it from external source.`,
                    );
                  return t;
                }
                return e;
              }
              let o = (e.themes ?? []).map((e) => i(e)),
                l = (e.langs ?? []).map((e) => a(e)),
                c = await t2({
                  engine: e.engine ?? n(),
                  ...e,
                  themes: o,
                  langs: l,
                });
              return {
                ...c,
                loadLanguage: (...e) => c.loadLanguage(...e.map(a)),
                loadTheme: (...e) => c.loadTheme(...e.map(i)),
                getBundledLanguages: () => t,
                getBundledThemes: () => r,
              };
            };
          },
          "a",
          0,
          function (e = {}) {
            let {
                name: t = "css-variables",
                variablePrefix: r = "--shiki-",
                fontStyle: n = !0,
              } = e,
              s = (t) =>
                e.variableDefaults?.[t]
                  ? `var(${r}${t}, ${e.variableDefaults[t]})`
                  : `var(${r}${t})`,
              a = {
                name: t,
                type: "dark",
                colors: {
                  "editor.foreground": s("foreground"),
                  "editor.background": s("background"),
                  "terminal.ansiBlack": s("ansi-black"),
                  "terminal.ansiRed": s("ansi-red"),
                  "terminal.ansiGreen": s("ansi-green"),
                  "terminal.ansiYellow": s("ansi-yellow"),
                  "terminal.ansiBlue": s("ansi-blue"),
                  "terminal.ansiMagenta": s("ansi-magenta"),
                  "terminal.ansiCyan": s("ansi-cyan"),
                  "terminal.ansiWhite": s("ansi-white"),
                  "terminal.ansiBrightBlack": s("ansi-bright-black"),
                  "terminal.ansiBrightRed": s("ansi-bright-red"),
                  "terminal.ansiBrightGreen": s("ansi-bright-green"),
                  "terminal.ansiBrightYellow": s("ansi-bright-yellow"),
                  "terminal.ansiBrightBlue": s("ansi-bright-blue"),
                  "terminal.ansiBrightMagenta": s("ansi-bright-magenta"),
                  "terminal.ansiBrightCyan": s("ansi-bright-cyan"),
                  "terminal.ansiBrightWhite": s("ansi-bright-white"),
                },
                tokenColors: [
                  {
                    scope: [
                      "keyword.operator.accessor",
                      "meta.group.braces.round.function.arguments",
                      "meta.template.expression",
                      "markup.fenced_code meta.embedded.block",
                    ],
                    settings: { foreground: s("foreground") },
                  },
                  { scope: "emphasis", settings: { fontStyle: "italic" } },
                  {
                    scope: [
                      "strong",
                      "markup.heading.markdown",
                      "markup.bold.markdown",
                    ],
                    settings: { fontStyle: "bold" },
                  },
                  {
                    scope: ["markup.italic.markdown"],
                    settings: { fontStyle: "italic" },
                  },
                  {
                    scope: "meta.link.inline.markdown",
                    settings: {
                      fontStyle: "underline",
                      foreground: s("token-link"),
                    },
                  },
                  {
                    scope: ["string", "markup.fenced_code", "markup.inline"],
                    settings: { foreground: s("token-string") },
                  },
                  {
                    scope: ["comment", "string.quoted.docstring.multi"],
                    settings: { foreground: s("token-comment") },
                  },
                  {
                    scope: [
                      "constant.numeric",
                      "constant.language",
                      "constant.other.placeholder",
                      "constant.character.format.placeholder",
                      "variable.language.this",
                      "variable.other.object",
                      "variable.other.class",
                      "variable.other.constant",
                      "meta.property-name",
                      "meta.property-value",
                      "support",
                    ],
                    settings: { foreground: s("token-constant") },
                  },
                  {
                    scope: [
                      "keyword",
                      "storage.modifier",
                      "storage.type",
                      "storage.control.clojure",
                      "entity.name.function.clojure",
                      "entity.name.tag.yaml",
                      "support.function.node",
                      "support.type.property-name.json",
                      "punctuation.separator.key-value",
                      "punctuation.definition.template-expression",
                    ],
                    settings: { foreground: s("token-keyword") },
                  },
                  {
                    scope: "variable.parameter.function",
                    settings: { foreground: s("token-parameter") },
                  },
                  {
                    scope: [
                      "support.function",
                      "entity.name.type",
                      "entity.other.inherited-class",
                      "meta.function-call",
                      "meta.instance.constructor",
                      "entity.other.attribute-name",
                      "entity.name.function",
                      "constant.keyword.clojure",
                    ],
                    settings: { foreground: s("token-function") },
                  },
                  {
                    scope: [
                      "entity.name.tag",
                      "string.quoted",
                      "string.regexp",
                      "string.interpolated",
                      "string.template",
                      "string.unquoted.plain.out.yaml",
                      "keyword.other.template",
                    ],
                    settings: { foreground: s("token-string-expression") },
                  },
                  {
                    scope: [
                      "punctuation.definition.arguments",
                      "punctuation.definition.dict",
                      "punctuation.separator",
                      "meta.function-call.arguments",
                    ],
                    settings: { foreground: s("token-punctuation") },
                  },
                  {
                    scope: [
                      "markup.underline.link",
                      "punctuation.definition.metadata.markdown",
                    ],
                    settings: { foreground: s("token-link") },
                  },
                  {
                    scope: ["beginning.punctuation.definition.list.markdown"],
                    settings: { foreground: s("token-string") },
                  },
                  {
                    scope: [
                      "punctuation.definition.string.begin.markdown",
                      "punctuation.definition.string.end.markdown",
                      "string.other.link.title.markdown",
                      "string.other.link.description.markdown",
                    ],
                    settings: { foreground: s("token-keyword") },
                  },
                  {
                    scope: [
                      "markup.inserted",
                      "meta.diff.header.to-file",
                      "punctuation.definition.inserted",
                    ],
                    settings: { foreground: s("token-inserted") },
                  },
                  {
                    scope: [
                      "markup.deleted",
                      "meta.diff.header.from-file",
                      "punctuation.definition.deleted",
                    ],
                    settings: { foreground: s("token-deleted") },
                  },
                  {
                    scope: ["markup.changed", "punctuation.definition.changed"],
                    settings: { foreground: s("token-changed") },
                  },
                ],
              };
            return (
              n ||
                (a.tokenColors = a.tokenColors?.map(
                  (e) => (
                    e.settings?.fontStyle && delete e.settings.fontStyle,
                    e
                  ),
                )),
              a
            );
          },
          "b",
          0,
          function (e) {
            let t = eR(e);
            return {
              getLastGrammarState: (...e) => eU(t, ...e),
              codeToTokensBase: (e, r) => tX(t, e, r),
              codeToTokensWithThemes: (e, r) => ez(t, e, r),
              codeToTokens: (e, r) => tQ(t, e, r),
              codeToHast: (e, r) => tJ(t, e, r),
              codeToHtml: (e, r) => t1(t, e, r),
              getBundledLanguages: () => ({}),
              getBundledThemes: () => ({}),
              ...t,
              getInternalContext: () => t,
            };
          },
          "v",
          0,
          function (e, t) {
            let r,
              n = async function (t = {}) {
                if (r) {
                  let e = await r;
                  return (
                    await Promise.all([
                      e.loadTheme(...(t.themes || [])),
                      e.loadLanguage(...(t.langs || [])),
                    ]),
                    e
                  );
                }
                {
                  r = e({ ...t, themes: [], langs: [] });
                  let n = await r;
                  return (
                    await Promise.all([
                      n.loadTheme(...(t.themes || [])),
                      n.loadLanguage(...(t.langs || [])),
                    ]),
                    n
                  );
                }
              };
            async function s(e, r) {
              let s = await n({
                  langs: [r.lang],
                  themes: "theme" in r ? [r.theme] : Object.values(r.themes),
                }),
                a = await t?.guessEmbeddedLanguages?.(e, r.lang, s);
              return (a && (await s.loadLanguage(...a)), s);
            }
            return {
              getSingletonHighlighter: (e) => n(e),
              codeToHtml: async (e, t) => (await s(e, t)).codeToHtml(e, t),
              codeToHast: async (e, t) => (await s(e, t)).codeToHast(e, t),
              codeToTokens: async (e, t) => (await s(e, t)).codeToTokens(e, t),
              codeToTokensBase: async (e, t) =>
                (await s(e, t)).codeToTokensBase(e, t),
              codeToTokensWithThemes: async (e, t) =>
                (await s(e, t)).codeToTokensWithThemes(e, t),
              getLastGrammarState: async (e, t) =>
                (
                  await n({ langs: [t.lang], themes: [t.theme] })
                ).getLastGrammarState(e, t),
            };
          },
          "g",
          0,
          function (e, t, r) {
            let n = new Set();
            for (let t of e.matchAll(tL)) {
              let e = t[1].toLowerCase().trim();
              e && n.add(e);
            }
            for (let t of e.matchAll(tP)) {
              let e = t[1].toLowerCase().trim();
              e && n.add(e);
            }
            for (let t of e.matchAll(tR)) {
              let e = t[1].toLowerCase().trim();
              e && n.add(e);
            }
            for (let t of e.matchAll(tT)) {
              let e = t[1].toLowerCase().trim(),
                r = e.includes("/") ? e.split("/").pop() : e;
              r && n.add(r);
            }
            if ((tM.test(e) && n.add("yaml"), !r)) return [...n];
            let s = r.getBundledLanguages();
            return [...n].filter((e) => e && s[e]);
          },
        ],
        77313,
      );
      var t5 = class {
        patterns;
        options;
        regexps;
        lastSearches;
        constructor(e, t = {}) {
          ((this.patterns = e), (this.options = t));
          let { forgiving: r = !1, cache: n, regexConstructor: s } = t;
          if (!s) throw Error("Option `regexConstructor` is not provided");
          ((this.regexps = e.map((e) => {
            if ("string" != typeof e) return e;
            let t = n?.get(e);
            if (t) {
              if (t instanceof RegExp) return t;
              if (r) return null;
              throw t;
            }
            try {
              let t = s(e);
              return (n?.set(e, t), t);
            } catch (t) {
              if ((n?.set(e, t), r)) return null;
              throw t;
            }
          })),
            (this.lastSearches = this.regexps.map((e) => {
              var t;
              return !e || (t = e).sticky || t.rawOptions?.strategy
                ? null
                : { strId: 0, searchedFrom: 0, matchIndex: -1, indices: null };
            })));
        }
        findNextMatchSync(e, t, r) {
          let n = "string" == typeof e ? e : e.content,
            s = "string" == typeof e ? 0 : e.id || 0,
            a = -1,
            i = 0,
            o = null;
          for (let e = 0; e < this.regexps.length; e++) {
            let r = this.regexps[e];
            if (r)
              try {
                let l,
                  c,
                  u = s ? this.lastSearches[e] : null;
                if (
                  u &&
                  u.strId === s &&
                  u.searchedFrom <= t &&
                  (-1 === u.matchIndex || u.matchIndex >= t)
                )
                  ((l = u.matchIndex), (c = u.indices));
                else {
                  r.lastIndex = t;
                  let e = r.exec(n);
                  ((l = e ? e.index : -1),
                    (c = e ? e.indices : null),
                    u &&
                      ((u.strId = s),
                      (u.searchedFrom = t),
                      (u.matchIndex = l),
                      (u.indices = c)));
                }
                if (-1 === l) continue;
                if (l === t) return t3(e, c);
                (-1 === a || l < i) && ((a = e), (i = l), (o = c));
              } catch (e) {
                if (this.options.forgiving) continue;
                throw e;
              }
          }
          return -1 === a ? null : t3(a, o);
        }
      };
      let t8 = 0;
      function t4(e) {
        return { content: e, id: ++t8 };
      }
      function t6(e) {
        if (1 != [...e].length)
          throw Error(`Expected "${e}" to be a single code point`);
        return e.codePointAt(0);
      }
      let t9 = new Set([
          "alnum",
          "alpha",
          "ascii",
          "blank",
          "cntrl",
          "digit",
          "graph",
          "lower",
          "print",
          "punct",
          "space",
          "upper",
          "word",
          "xdigit",
        ]),
        t7 = String.raw;
      function re(e, t) {
        if (null == e) throw Error(t ?? "Value expected");
        return e;
      }
      let rt = t7`\[\^?`,
        rr = `c.? | C(?:-.?)?|${t7`[pP]\{(?:\^?[-\x20_]*[A-Za-z][-\x20\w]*\})?`}|${t7`x[89A-Fa-f]\p{AHex}(?:\\x[89A-Fa-f]\p{AHex})*`}|${t7`u(?:\p{AHex}{4})? | x\{[^\}]*\}? | x\p{AHex}{0,2}`}|${t7`o\{[^\}]*\}?`}|${t7`\d{1,3}`}`,
        rn = /[?*+][?+]?|\{(?:\d+(?:,\d*)?|,\d+)\}\??/,
        rs = RegExp(
          t7`
  \\ (?:
    ${rr}
    | [gk]<[^>]*>?
    | [gk]'[^']*'?
    | .
  )
  | \( (?:
    \? (?:
      [:=!>({]
      | <[=!]
      | <[^>]*>
      | '[^']*'
      | ~\|?
      | #(?:[^)\\]|\\.?)*
      | [^:)]*[:)]
    )?
    | \*[^\)]*\)?
  )?
  | (?:${rn.source})+
  | ${rt}
  | .
`.replace(/\s+/g, ""),
          "gsu",
        ),
        ra = RegExp(
          t7`
  \\ (?:
    ${rr}
    | .
  )
  | \[:(?:\^?\p{Alpha}+|\^):\]
  | ${rt}
  | &&
  | .
`.replace(/\s+/g, ""),
          "gsu",
        );
      function ri(e, { inCharClass: t }) {
        let r = e[1];
        if ("c" === r || "C" === r) {
          var n,
            s = e;
          let t = "c" === s[1] ? s[2] : s[3];
          if (!t || !/[A-Za-z]/.test(t))
            throw Error(`Unsupported control character "${s}"`);
          return rc(t6(t.toUpperCase()) - 64, s);
        }
        if ("dDhHsSwW".includes(r)) {
          let t;
          return rh(
            { d: "digit", h: "hex", s: "space", w: "word" }[
              (t = (n = e)[1].toLowerCase())
            ],
            n,
            { negate: n[1] !== t },
          );
        }
        if (e.startsWith(t7`\o{`))
          throw Error(
            `Incomplete, invalid, or unsupported octal code point "${e}"`,
          );
        if (/^\\[pP]\{/.test(e)) {
          if (3 === e.length)
            throw Error(`Incomplete or invalid Unicode property "${e}"`);
          return (function (e) {
            let {
              p: t,
              neg: r,
              value: n,
            } = /^\\(?<p>[pP])\{(?<neg>\^?)(?<value>[^}]+)/.exec(e).groups;
            return rh("property", e, {
              value: n,
              negate: ("P" === t && !r) || ("p" === t && !!r),
            });
          })(e);
        }
        if (/^\\x[89A-Fa-f]\p{AHex}/u.test(e))
          try {
            let t = e
                .split(/\\x/)
                .slice(1)
                .map((e) => parseInt(e, 16)),
              r = new TextDecoder("utf-8", { ignoreBOM: !0, fatal: !0 }).decode(
                new Uint8Array(t),
              ),
              n = new TextEncoder();
            return [...r].map((e) => {
              let t = [...n.encode(e)]
                .map((e) => `\\x${e.toString(16)}`)
                .join("");
              return rc(t6(e), t);
            });
          } catch {
            throw Error(
              `Multibyte code "${e}" incomplete or invalid in Oniguruma`,
            );
          }
        if ("u" === r || "x" === r)
          return rc(
            (function (e) {
              if (
                /^(?:\\u(?!\p{AHex}{4})|\\x(?!\p{AHex}{1,2}|\{\p{AHex}{1,8}\}))/u.test(
                  e,
                )
              )
                throw Error(`Incomplete or invalid escape "${e}"`);
              return parseInt(
                "{" === e[2]
                  ? /^\\x\{\s*(?<hex>\p{AHex}+)/u.exec(e).groups.hex
                  : e.slice(2),
                16,
              );
            })(e),
            e,
          );
        if (rf.has(r)) return rc(rf.get(r), e);
        if (/\d/.test(r))
          return { type: "EscapedNumber", inCharClass: t, raw: e };
        if ("\\" === e) throw Error(t7`Incomplete escape "\"`);
        if ("M" === r) throw Error(`Unsupported meta "${e}"`);
        if (2 == [...e].length) return rc(e.codePointAt(1), e);
        throw Error(`Unexpected escape "${e}"`);
      }
      function ro(e, t) {
        return { type: "Assertion", kind: e, raw: t };
      }
      function rl(e) {
        return { type: "Backreference", raw: e };
      }
      function rc(e, t) {
        return { type: "Character", value: e, raw: t };
      }
      function ru(e, t) {
        return { type: "CharacterClassOpen", negate: e, raw: t };
      }
      function rh(e, t, r = {}) {
        return { type: "CharacterSet", kind: e, ...r, raw: t };
      }
      function rp(e, t, r = {}) {
        return "keep" === e
          ? { type: "Directive", kind: e, raw: t }
          : { type: "Directive", kind: e, flags: re(r.flags), raw: t };
      }
      function rd(e, t, r = {}) {
        return { type: "GroupOpen", kind: e, ...r, raw: t };
      }
      let rg = new Set([
          "COUNT",
          "CMP",
          "ERROR",
          "FAIL",
          "MAX",
          "MISMATCH",
          "SKIP",
          "TOTAL_COUNT",
        ]),
        rf = new Map([
          ["a", 7],
          ["b", 8],
          ["e", 27],
          ["f", 12],
          ["n", 10],
          ["r", 13],
          ["t", 9],
          ["v", 11],
        ]);
      function rm(e) {
        let t = null,
          r,
          n;
        if ("{" === e[0]) {
          let { minStr: s, maxStr: a } =
            /^\{(?<minStr>\d*)(?:,(?<maxStr>\d*))?/.exec(e).groups;
          if (+s > 1e5 || (a && +a > 1e5))
            throw Error("Quantifier value unsupported in Oniguruma");
          if (
            ((r = +s) > (n = void 0 === a ? +s : "" === a ? 1 / 0 : +a) &&
              ((t = "possessive"), ([r, n] = [n, r])),
            e.endsWith("?"))
          ) {
            if ("possessive" === t)
              throw Error(
                'Unsupported possessive interval quantifier chain with "?"',
              );
            t = "lazy";
          } else t || (t = "greedy");
        } else
          ((r = +("+" === e[0])),
            (n = "?" === e[0] ? 1 : 1 / 0),
            (t =
              "+" === e[1] ? "possessive" : "?" === e[1] ? "lazy" : "greedy"));
        return { type: "Quantifier", kind: t, min: r, max: n, raw: e };
      }
      function ry(e) {
        let t = {};
        return (
          e.includes("i") && (t.ignoreCase = !0),
          e.includes("m") && (t.dotAll = !0),
          e.includes("x") && (t.extended = !0),
          Object.keys(t).length ? t : null
        );
      }
      function rb(e, t) {
        if (!Array.isArray(e.body))
          throw Error("Expected node with body array");
        if (1 !== e.body.length) return !1;
        let r = e.body[0];
        return !t || Object.keys(t).every((e) => t[e] === r[e]);
      }
      let r_ = new Set([
        "AbsenceFunction",
        "Backreference",
        "CapturingGroup",
        "Character",
        "CharacterClass",
        "CharacterSet",
        "Group",
        "Quantifier",
        "Subroutine",
      ]);
      function rk(e, t = {}) {
        var r;
        let n = {
            flags: "",
            normalizeUnknownPropertyNames: !1,
            skipBackrefValidation: !1,
            skipLookbehindValidation: !1,
            skipPropertyNameValidation: !1,
            unicodePropertyMap: null,
            ...t,
            rules: { captureGroup: !1, singleline: !1, ...t.rules },
          },
          s = (function (e, t = {}) {
            let r = {
              flags: "",
              ...t,
              rules: { captureGroup: !1, singleline: !1, ...t.rules },
            };
            if ("string" != typeof e) throw Error("String expected as pattern");
            let n = (function (e) {
                let t = {
                  ignoreCase: !1,
                  dotAll: !1,
                  extended: !1,
                  digitIsAscii: !1,
                  posixIsAscii: !1,
                  spaceIsAscii: !1,
                  wordIsAscii: !1,
                  textSegmentMode: null,
                };
                for (let r = 0; r < e.length; r++) {
                  let n = e[r];
                  if (!"imxDPSWy".includes(n))
                    throw Error(`Invalid flag "${n}"`);
                  if ("y" === n) {
                    if (!/^y{[gw]}/.test(e.slice(r)))
                      throw Error('Invalid or unspecified flag "y" mode');
                    ((t.textSegmentMode =
                      "g" === e[r + 2] ? "grapheme" : "word"),
                      (r += 3));
                    continue;
                  }
                  t[
                    {
                      i: "ignoreCase",
                      m: "dotAll",
                      x: "extended",
                      D: "digitIsAscii",
                      P: "posixIsAscii",
                      S: "spaceIsAscii",
                      W: "wordIsAscii",
                    }[n]
                  ] = !0;
                }
                return t;
              })(r.flags),
              s = [n.extended],
              a = {
                captureGroup: r.rules.captureGroup,
                getCurrentModX: () => s.at(-1),
                numOpenGroups: 0,
                popModX() {
                  s.pop();
                },
                pushModX(e) {
                  s.push(e);
                },
                replaceCurrentModX(e) {
                  s[s.length - 1] = e;
                },
                singleline: r.rules.singleline,
              },
              i = [],
              o;
            for (rs.lastIndex = 0; (o = rs.exec(e));) {
              let t = (function (e, t, r, n) {
                let [s, a] = r;
                if ("[" === r || "[^" === r) {
                  let e = (function (e, t, r) {
                    let n = [ru("^" === t[1], t)],
                      s = 1,
                      a;
                    for (ra.lastIndex = r; (a = ra.exec(e));) {
                      let e = a[0];
                      if ("[" === e[0] && ":" !== e[1])
                        (s++, n.push(ru("^" === e[1], e)));
                      else if ("]" === e) {
                        if ("CharacterClassOpen" === n.at(-1).type)
                          n.push(rc(93, e));
                        else if (
                          (s--,
                          n.push({ type: "CharacterClassClose", raw: e }),
                          !s)
                        )
                          break;
                      } else {
                        let t = (function (e) {
                          if ("\\" === e[0]) return ri(e, { inCharClass: !0 });
                          if ("[" === e[0]) {
                            let t = /\[:(?<negate>\^?)(?<name>[a-z]+):\]/.exec(
                              e,
                            );
                            if (!t || !t9.has(t.groups.name))
                              throw Error(`Invalid POSIX class "${e}"`);
                            return rh("posix", e, {
                              value: t.groups.name,
                              negate: !!t.groups.negate,
                            });
                          }
                          return "-" === e
                            ? { type: "CharacterClassHyphen", raw: e }
                            : "&&" === e
                              ? { type: "CharacterClassIntersector", raw: e }
                              : rc(t6(e), e);
                        })(e);
                        Array.isArray(t) ? n.push(...t) : n.push(t);
                      }
                    }
                    return { tokens: n, lastIndex: ra.lastIndex || e.length };
                  })(t, r, n);
                  return { tokens: e.tokens, lastIndex: e.lastIndex };
                }
                if ("\\" === s) {
                  if ("AbBGyYzZ".includes(a)) return { token: ro(r, r) };
                  if (/^\\g[<']/.test(r)) {
                    if (!/^\\g(?:<[^>]+>|'[^']+')$/.test(r))
                      throw Error(`Invalid group name "${r}"`);
                    return { token: { type: "Subroutine", raw: r } };
                  }
                  if (/^\\k[<']/.test(r)) {
                    if (!/^\\k(?:<[^>]+>|'[^']+')$/.test(r))
                      throw Error(`Invalid group name "${r}"`);
                    return { token: rl(r) };
                  }
                  if ("K" === a) return { token: rp("keep", r) };
                  if ("N" === a || "R" === a)
                    return { token: rh("newline", r, { negate: "N" === a }) };
                  if ("O" === a) return { token: rh("any", r) };
                  if ("X" === a) return { token: rh("text_segment", r) };
                  let e = ri(r, { inCharClass: !1 });
                  return Array.isArray(e) ? { tokens: e } : { token: e };
                }
                if ("(" === s) {
                  if ("*" === a)
                    return {
                      token: (function (e) {
                        let t =
                          /\(\*(?<name>[A-Za-z_]\w*)?(?:\[(?<tag>(?:[A-Za-z_]\w*)?)\])?(?:\{(?<args>[^}]*)\})?\)/.exec(
                            e,
                          );
                        if (!t)
                          throw Error(
                            `Incomplete or invalid named callout "${e}"`,
                          );
                        let { name: r, tag: n, args: s } = t.groups;
                        if (!r) throw Error(`Invalid named callout "${e}"`);
                        if ("" === n)
                          throw Error(
                            `Named callout tag with empty value not allowed "${e}"`,
                          );
                        let a = s
                            ? s
                                .split(",")
                                .filter((e) => "" !== e)
                                .map((e) => (/^[+-]?\d+$/.test(e) ? +e : e))
                            : [],
                          [i, o, l] = a,
                          c = rg.has(r) ? r.toLowerCase() : "custom";
                        switch (c) {
                          case "fail":
                          case "mismatch":
                          case "skip":
                            if (a.length > 0)
                              throw Error(
                                `Named callout arguments not allowed "${a}"`,
                              );
                            break;
                          case "error":
                            if (a.length > 1)
                              throw Error(
                                `Named callout allows only one argument "${a}"`,
                              );
                            if ("string" == typeof i)
                              throw Error(
                                `Named callout argument must be a number "${i}"`,
                              );
                            break;
                          case "max":
                            if (!a.length || a.length > 2)
                              throw Error(
                                `Named callout must have one or two arguments "${a}"`,
                              );
                            if (
                              "string" == typeof i &&
                              !/^[A-Za-z_]\w*$/.test(i)
                            )
                              throw Error(
                                `Named callout argument one must be a tag or number "${i}"`,
                              );
                            if (
                              2 === a.length &&
                              ("number" == typeof o || !/^[<>X]$/.test(o))
                            )
                              throw Error(
                                `Named callout optional argument two must be '<', '>', or 'X' "${o}"`,
                              );
                            break;
                          case "count":
                          case "total_count":
                            if (a.length > 1)
                              throw Error(
                                `Named callout allows only one argument "${a}"`,
                              );
                            if (
                              1 === a.length &&
                              ("number" == typeof i || !/^[<>X]$/.test(i))
                            )
                              throw Error(
                                `Named callout optional argument must be '<', '>', or 'X' "${i}"`,
                              );
                            break;
                          case "cmp":
                            if (3 !== a.length)
                              throw Error(
                                `Named callout must have three arguments "${a}"`,
                              );
                            if (
                              "string" == typeof i &&
                              !/^[A-Za-z_]\w*$/.test(i)
                            )
                              throw Error(
                                `Named callout argument one must be a tag or number "${i}"`,
                              );
                            if (
                              "number" == typeof o ||
                              !/^(?:[<>!=]=|[<>])$/.test(o)
                            )
                              throw Error(
                                `Named callout argument two must be '==', '!=', '>', '<', '>=', or '<=' "${o}"`,
                              );
                            if (
                              "string" == typeof l &&
                              !/^[A-Za-z_]\w*$/.test(l)
                            )
                              throw Error(
                                `Named callout argument three must be a tag or number "${l}"`,
                              );
                            break;
                          case "custom":
                            throw Error(`Undefined callout name "${r}"`);
                          default:
                            throw Error(`Unexpected named callout kind "${c}"`);
                        }
                        return {
                          type: "NamedCallout",
                          kind: c,
                          tag: n ?? null,
                          arguments: s?.split(",") ?? null,
                          raw: e,
                        };
                      })(r),
                    };
                  if ("(?{" === r) throw Error(`Unsupported callout "${r}"`);
                  if (r.startsWith("(?#")) {
                    if (")" !== t[n])
                      throw Error('Unclosed comment group "(?#"');
                    return { lastIndex: n + 1 };
                  }
                  if (/^\(\?[-imx]+[:)]$/.test(r))
                    return {
                      token: (function (e, t) {
                        let { on: r, off: n } =
                          /^\(\?(?<on>[imx]*)(?:-(?<off>[-imx]*))?/.exec(
                            e,
                          ).groups;
                        n ??= "";
                        let s =
                            (t.getCurrentModX() || r.includes("x")) &&
                            !n.includes("x"),
                          a = ry(r),
                          i = ry(n),
                          o = {};
                        if (
                          (a && (o.enable = a),
                          i && (o.disable = i),
                          e.endsWith(")"))
                        )
                          return (
                            t.replaceCurrentModX(s),
                            rp("flags", e, { flags: o })
                          );
                        if (e.endsWith(":"))
                          return (
                            t.pushModX(s),
                            t.numOpenGroups++,
                            rd("group", e, { ...((a || i) && { flags: o }) })
                          );
                        throw Error(`Unexpected flag modifier "${e}"`);
                      })(r, e),
                    };
                  if (
                    (e.pushModX(e.getCurrentModX()),
                    e.numOpenGroups++,
                    ("(" === r && !e.captureGroup) || "(?:" === r)
                  )
                    return { token: rd("group", r) };
                  if ("(?>" === r) return { token: rd("atomic", r) };
                  if (
                    "(?=" === r ||
                    "(?!" === r ||
                    "(?<=" === r ||
                    "(?<!" === r
                  )
                    return {
                      token: rd("<" === r[2] ? "lookbehind" : "lookahead", r, {
                        negate: r.endsWith("!"),
                      }),
                    };
                  if (
                    ("(" === r && e.captureGroup) ||
                    (r.startsWith("(?<") && r.endsWith(">")) ||
                    (r.startsWith("(?'") && r.endsWith("'"))
                  )
                    return {
                      token: rd("capturing", r, {
                        ...("(" !== r && { name: r.slice(3, -1) }),
                      }),
                    };
                  if (r.startsWith("(?~")) {
                    if ("(?~|" === r)
                      throw Error(`Unsupported absence function kind "${r}"`);
                    return { token: rd("absence_repeater", r) };
                  }
                  throw "(?(" === r
                    ? Error(`Unsupported conditional "${r}"`)
                    : Error(`Invalid or unsupported group option "${r}"`);
                }
                if (")" === r) {
                  if ((e.popModX(), e.numOpenGroups--, e.numOpenGroups < 0))
                    throw Error('Unmatched ")"');
                  return { token: { type: "GroupClose", raw: r } };
                }
                if (e.getCurrentModX()) {
                  if ("#" === r) {
                    let e = t.indexOf(
                      `
`,
                      n,
                    );
                    return { lastIndex: -1 === e ? t.length : e };
                  }
                  if (/^\s$/.test(r)) {
                    let e = /\s+/y;
                    return (
                      (e.lastIndex = n),
                      { lastIndex: e.exec(t) ? e.lastIndex : n }
                    );
                  }
                }
                return "." === r
                  ? { token: rh("dot", r) }
                  : "^" === r || "$" === r
                    ? {
                        token: ro(
                          e.singleline ? { "^": t7`\A`, $: t7`\Z` }[r] : r,
                          r,
                        ),
                      }
                    : "|" === r
                      ? { token: { type: "Alternator", raw: r } }
                      : rn.test(r)
                        ? {
                            tokens: (function (e) {
                              let t,
                                r = [],
                                n = RegExp(rn, "gy");
                              for (; (t = n.exec(e));) {
                                let e = t[0];
                                if ("{" === e[0]) {
                                  let t =
                                    /^\{(?<min>\d+),(?<max>\d+)\}\??$/.exec(e);
                                  if (t) {
                                    let { min: s, max: a } = t.groups;
                                    if (+s > +a && e.endsWith("?")) {
                                      (n.lastIndex--,
                                        r.push(rm(e.slice(0, -1))));
                                      continue;
                                    }
                                  }
                                }
                                r.push(rm(e));
                              }
                              return r;
                            })(r),
                          }
                        : { token: rc(t6(r), r) };
              })(a, e, o[0], rs.lastIndex);
              (t.tokens ? i.push(...t.tokens) : t.token && i.push(t.token),
                void 0 !== t.lastIndex && (rs.lastIndex = t.lastIndex));
            }
            let l = [],
              c = 0;
            (i
              .filter((e) => "GroupOpen" === e.type)
              .forEach((e) => {
                "capturing" === e.kind
                  ? (e.number = ++c)
                  : "(" === e.raw && l.push(e);
              }),
              c ||
                l.forEach((e, t) => {
                  ((e.kind = "capturing"), (e.number = t + 1));
                }));
            let u = c || l.length;
            return {
              tokens: i
                .map((e) =>
                  "EscapedNumber" === e.type
                    ? (function (e, t) {
                        let { raw: r, inCharClass: n } = e,
                          s = r.slice(1);
                        if (
                          !n &&
                          (("0" !== s && 1 === s.length) ||
                            ("0" !== s[0] && +s <= t))
                        )
                          return [rl(r)];
                        let a = [],
                          i = s.match(/^[0-7]+|\d/g);
                        for (let e = 0; e < i.length; e++) {
                          let t,
                            n = i[e];
                          if (0 === e && "8" !== n && "9" !== n) {
                            if ((t = parseInt(n, 8)) > 127)
                              throw Error(
                                t7`Octal encoded byte above 177 unsupported "${r}"`,
                              );
                          } else t = t6(n);
                          a.push(rc(t, (0 === e ? "\\" : "") + n));
                        }
                        return a;
                      })(e, u)
                    : e,
                )
                .flat(),
              flags: n,
            };
          })(e, {
            flags: n.flags,
            rules: {
              captureGroup: n.rules.captureGroup,
              singleline: n.rules.singleline,
            },
          }),
          a = (e, t) => {
            let r = s.tokens[i.nextIndex];
            switch (((i.parent = e), i.nextIndex++, r.type)) {
              case "Alternator":
                return rw();
              case "Assertion":
                return (function ({ kind: e }) {
                  return rC(
                    re(
                      {
                        "^": "line_start",
                        $: "line_end",
                        "\\A": "string_start",
                        "\\b": "word_boundary",
                        "\\B": "word_boundary",
                        "\\G": "search_start",
                        "\\y": "text_segment_boundary",
                        "\\Y": "text_segment_boundary",
                        "\\z": "string_end",
                        "\\Z": "string_end_newline",
                      }[e],
                      `Unexpected assertion kind "${e}"`,
                    ),
                    { negate: e === t7`\B` || e === t7`\Y` },
                  );
                })(r);
              case "Backreference":
                return (function ({ raw: e }, t) {
                  let r = /^\\k[<']/.test(e),
                    n = r ? e.slice(3, -1) : e.slice(1),
                    s = (r, n = !1) => {
                      let s = t.capturingGroups.length,
                        a = !1;
                      if (r > s)
                        if (t.skipBackrefValidation) a = !0;
                        else
                          throw Error(
                            `Not enough capturing groups defined to the left "${e}"`,
                          );
                      return (
                        (t.hasNumberedRef = !0),
                        rS(n ? s + 1 - r : r, { orphan: a })
                      );
                    };
                  if (r) {
                    let r = /^(?<sign>-?)0*(?<num>[1-9]\d*)$/.exec(n);
                    if (r) return s(+r.groups.num, !!r.groups.sign);
                    if (/[-+]/.test(n))
                      throw Error(`Invalid backref name "${e}"`);
                    if (!t.namedGroupsByName.has(n))
                      throw Error(`Group name not defined to the left "${e}"`);
                    return rS(n);
                  }
                  return s(+n);
                })(r, i);
              case "Character":
                return rv(r.value, { useLastValid: !!t.isCheckingRangeEnd });
              case "CharacterClassHyphen":
                return (function (e, t) {
                  let { tokens: r, walk: n } = e,
                    s = e.parent,
                    a = s.body.at(-1),
                    i = r[e.nextIndex];
                  if (
                    !t.isCheckingRangeEnd &&
                    a &&
                    "CharacterClass" !== a.type &&
                    "CharacterClassRange" !== a.type &&
                    i &&
                    "CharacterClassOpen" !== i.type &&
                    "CharacterClassClose" !== i.type &&
                    "CharacterClassIntersector" !== i.type
                  ) {
                    let e = n(s, { ...t, isCheckingRangeEnd: !0 });
                    if ("Character" === a.type && "Character" === e.type)
                      return (
                        s.body.pop(),
                        (function (e, t) {
                          if (t.value < e.value)
                            throw Error("Character class range out of order");
                          return {
                            type: "CharacterClassRange",
                            min: e,
                            max: t,
                          };
                        })(a, e)
                      );
                    throw Error("Invalid character class range");
                  }
                  return rv(t6("-"));
                })(i, t);
              case "CharacterClassOpen":
                return (function ({ negate: e }, t, r) {
                  let { tokens: n, walk: s } = t,
                    a = [rA()],
                    i = n[t.nextIndex],
                    o = rO(i);
                  for (; "CharacterClassClose" !== o.type;) {
                    if ("CharacterClassIntersector" === o.type)
                      (a.push(rA()), t.nextIndex++);
                    else {
                      let e = a.at(-1);
                      e.body.push(s(e, r));
                    }
                    o = rO(n[t.nextIndex], i);
                  }
                  let l = rA({ negate: e });
                  return (
                    1 === a.length
                      ? (l.body = a[0].body)
                      : ((l.kind = "intersection"),
                        (l.body = a.map((e) =>
                          1 === e.body.length ? e.body[0] : e,
                        ))),
                    t.nextIndex++,
                    l
                  );
                })(r, i, t);
              case "CharacterSet":
                return (function ({ kind: e, negate: t, value: r }, n) {
                  let {
                    normalizeUnknownPropertyNames: s,
                    skipPropertyNameValidation: a,
                    unicodePropertyMap: i,
                  } = n;
                  if ("property" === e) {
                    let n = rB(r);
                    if (!t9.has(n) || i?.has(n))
                      return rP(r, {
                        negate: t,
                        normalizeUnknownPropertyNames: s,
                        skipPropertyNameValidation: a,
                        unicodePropertyMap: i,
                      });
                    ((e = "posix"), (r = n));
                  }
                  return "posix" === e
                    ? (function (e, t) {
                        let r = !!t?.negate;
                        if (!t9.has(e))
                          throw Error(`Invalid POSIX class "${e}"`);
                        return {
                          type: "CharacterSet",
                          kind: "posix",
                          value: e,
                          negate: r,
                        };
                      })(r, { negate: t })
                    : rN(e, { negate: t });
                })(r, i);
              case "Directive":
                return (function (e, t = {}) {
                  if ("keep" === e) return { type: "Directive", kind: e };
                  if ("flags" === e)
                    return { type: "Directive", kind: e, flags: re(t.flags) };
                  throw Error(`Unexpected directive kind "${e}"`);
                })(r.kind, { flags: r.flags });
              case "GroupOpen":
                return (function (e, t, r) {
                  var n, s;
                  let {
                      tokens: a,
                      capturingGroups: i,
                      namedGroupsByName: o,
                      skipLookbehindValidation: l,
                      walk: c,
                    } = t,
                    u = (function ({
                      flags: e,
                      kind: t,
                      name: r,
                      negate: n,
                      number: s,
                    }) {
                      switch (t) {
                        case "absence_repeater":
                          var a = "repeater";
                          !1;
                          return {
                            type: "AbsenceFunction",
                            kind: a,
                            body: rR(void 0),
                          };
                        case "atomic":
                          return rE({ atomic: !0 });
                        case "capturing":
                          return rx(s, { name: r });
                        case "group":
                          return rE({ flags: e });
                        case "lookahead":
                        case "lookbehind":
                          return rI({ behind: "lookbehind" === t, negate: n });
                        default:
                          throw Error(`Unexpected group kind "${t}"`);
                      }
                    })(e),
                    h = "AbsenceFunction" === u.type,
                    p = rG(u),
                    d = p && u.negate;
                  if (
                    ("CapturingGroup" === u.type &&
                      (i.push(u),
                      u.name &&
                        ((n = u.name),
                        (s = []),
                        o.has(n) || o.set(n, s),
                        o.get(n)).push(u)),
                    h && r.isInAbsenceFunction)
                  )
                    throw Error(
                      "Nested absence function not supported by Oniguruma",
                    );
                  let g = rF(a[t.nextIndex]);
                  for (; "GroupClose" !== g.type;) {
                    if ("Alternator" === g.type)
                      (u.body.push(rw()), t.nextIndex++);
                    else {
                      let e = u.body.at(-1),
                        t = c(e, {
                          ...r,
                          isInAbsenceFunction: r.isInAbsenceFunction || h,
                          isInLookbehind: r.isInLookbehind || p,
                          isInNegLookbehind: r.isInNegLookbehind || d,
                        });
                      if ((e.body.push(t), (p || r.isInLookbehind) && !l)) {
                        let e =
                          "Lookbehind includes a pattern not allowed by Oniguruma";
                        if (d || r.isInNegLookbehind) {
                          if (rM(t) || "CapturingGroup" === t.type)
                            throw Error(e);
                        } else if (rM(t) || (rG(t) && t.negate)) throw Error(e);
                      }
                    }
                    g = rF(a[t.nextIndex]);
                  }
                  return (t.nextIndex++, u);
                })(r, i, t);
              case "NamedCallout":
                var n, a;
                return (
                  (n = r.kind),
                  (a = r.tag),
                  {
                    type: "NamedCallout",
                    kind: n,
                    tag: a,
                    arguments: r.arguments,
                  }
                );
              case "Quantifier":
                return (function ({ kind: e, min: t, max: r }, n) {
                  let s = n.parent,
                    a = s.body.at(-1);
                  if (!a || !r_.has(a.type))
                    throw Error("Quantifier requires a repeatable token");
                  let i = r$(e, t, r, a);
                  return (s.body.pop(), i);
                })(r, i);
              case "Subroutine":
                return (function ({ raw: e }, t) {
                  let { capturingGroups: r, subroutines: n } = t,
                    s = e.slice(3, -1),
                    a = /^(?<sign>[-+]?)0*(?<num>[1-9]\d*)$/.exec(s);
                  if (a) {
                    let e = +a.groups.num,
                      n = r.length;
                    if (
                      ((t.hasNumberedRef = !0),
                      (s = { "": e, "+": n + e, "-": n + 1 - e }[
                        a.groups.sign
                      ]) < 1)
                    )
                      throw Error("Invalid subroutine number");
                  } else "0" === s && (s = 0);
                  let i = rL(s);
                  return (n.push(i), i);
                })(r, i);
              default:
                throw Error(`Unexpected token type "${r.type}"`);
            }
          },
          i = {
            capturingGroups: [],
            hasNumberedRef: !1,
            namedGroupsByName: new Map(),
            nextIndex: 0,
            normalizeUnknownPropertyNames: n.normalizeUnknownPropertyNames,
            parent: null,
            skipBackrefValidation: n.skipBackrefValidation,
            skipLookbehindValidation: n.skipLookbehindValidation,
            skipPropertyNameValidation: n.skipPropertyNameValidation,
            subroutines: [],
            tokens: s.tokens,
            unicodePropertyMap: n.unicodePropertyMap,
            walk: a,
          },
          o =
            ((r = { type: "Flags", ...s.flags }),
            { type: "Regex", body: rR(void 0), flags: r }),
          l = o.body[0];
        for (; i.nextIndex < s.tokens.length;) {
          let e = a(l, {});
          "Alternative" === e.type ? (o.body.push(e), (l = e)) : l.body.push(e);
        }
        let {
          capturingGroups: c,
          hasNumberedRef: u,
          namedGroupsByName: h,
          subroutines: p,
        } = i;
        if (u && h.size && !n.rules.captureGroup)
          throw Error(
            "Numbered backref/subroutine not allowed when using named capture",
          );
        for (let { ref: e } of p)
          if ("number" == typeof e) {
            if (e > c.length)
              throw Error("Subroutine uses a group number that's not defined");
            e && (c[e - 1].isSubroutined = !0);
          } else if (h.has(e)) {
            if (h.get(e).length > 1)
              throw Error(
                t7`Subroutine uses a duplicate group name "\g<${e}>"`,
              );
            h.get(e)[0].isSubroutined = !0;
          } else
            throw Error(
              t7`Subroutine uses a group name that's not defined "\g<${e}>"`,
            );
        return o;
      }
      function rw(e) {
        return { type: "Alternative", body: rT(e?.body) };
      }
      function rC(e, t) {
        let r = { type: "Assertion", kind: e };
        return (
          ("word_boundary" === e || "text_segment_boundary" === e) &&
            (r.negate = !!t?.negate),
          r
        );
      }
      function rS(e, t) {
        let r = !!t?.orphan;
        return { type: "Backreference", ref: e, ...(r && { orphan: r }) };
      }
      function rx(e, t) {
        var r;
        let n = { name: void 0, isSubroutined: !1, ...t };
        if (
          void 0 !== n.name &&
          ((r = n.name), !/^[\p{Alpha}\p{Pc}][^)]*$/u.test(r))
        )
          throw Error(`Group name "${n.name}" invalid in Oniguruma`);
        return {
          type: "CapturingGroup",
          number: e,
          ...(n.name && { name: n.name }),
          ...(n.isSubroutined && { isSubroutined: n.isSubroutined }),
          body: rR(t?.body),
        };
      }
      function rv(e, t) {
        let r = { useLastValid: !1, ...t };
        if (e > 1114111) {
          let t = e.toString(16);
          if (r.useLastValid) e = 1114111;
          else
            throw e > 1310719
              ? Error(`Invalid code point out of range "\\x{${t}}"`)
              : Error(`Invalid code point out of range in JS "\\x{${t}}"`);
        }
        return { type: "Character", value: e };
      }
      function rA(e) {
        let t = { kind: "union", negate: !1, ...e };
        return {
          type: "CharacterClass",
          kind: t.kind,
          negate: t.negate,
          body: rT(e?.body),
        };
      }
      function rN(e, t) {
        let r = !!t?.negate,
          n = { type: "CharacterSet", kind: e };
        return (
          ("digit" === e ||
            "hex" === e ||
            "newline" === e ||
            "space" === e ||
            "word" === e) &&
            (n.negate = r),
          ("text_segment" !== e && ("newline" !== e || r)) ||
            (n.variableLength = !0),
          n
        );
      }
      function rE(e) {
        let t = e?.atomic,
          r = e?.flags;
        if (t && r) throw Error("Atomic group cannot have flags");
        return {
          type: "Group",
          ...(t && { atomic: t }),
          ...(r && { flags: r }),
          body: rR(e?.body),
        };
      }
      function rI(e) {
        let t = { behind: !1, negate: !1, ...e };
        return {
          type: "LookaroundAssertion",
          kind: t.behind ? "lookbehind" : "lookahead",
          negate: t.negate,
          body: rR(e?.body),
        };
      }
      function r$(e, t, r, n) {
        if (t > r) throw Error("Invalid reversed quantifier range");
        return { type: "Quantifier", kind: e, min: t, max: r, body: n };
      }
      function rL(e) {
        return { type: "Subroutine", ref: e };
      }
      function rP(e, t) {
        let r = {
            negate: !1,
            normalizeUnknownPropertyNames: !1,
            skipPropertyNameValidation: !1,
            unicodePropertyMap: null,
            ...t,
          },
          n = r.unicodePropertyMap?.get(rB(e));
        if (!n) {
          if (r.normalizeUnknownPropertyNames)
            n = e
              .trim()
              .replace(/[- _]+/g, "_")
              .replace(/[A-Z][a-z]+(?=[A-Z])/g, "$&_")
              .replace(
                /[A-Za-z]+/g,
                (e) => e[0].toUpperCase() + e.slice(1).toLowerCase(),
              );
          else if (r.unicodePropertyMap && !r.skipPropertyNameValidation)
            throw Error(t7`Invalid Unicode property "\p{${e}}"`);
        }
        return {
          type: "CharacterSet",
          kind: "property",
          value: n ?? e,
          negate: r.negate,
        };
      }
      function rR(e) {
        if (void 0 === e) e = [rw()];
        else if (
          !Array.isArray(e) ||
          !e.length ||
          !e.every((e) => "Alternative" === e.type)
        )
          throw Error(
            "Invalid body; expected array of one or more Alternative nodes",
          );
        return e;
      }
      function rT(e) {
        if (void 0 === e) e = [];
        else if (!Array.isArray(e) || !e.every((e) => !!e.type))
          throw Error("Invalid body; expected array of nodes");
        return e;
      }
      function rM(e) {
        return "LookaroundAssertion" === e.type && "lookahead" === e.kind;
      }
      function rG(e) {
        return "LookaroundAssertion" === e.type && "lookbehind" === e.kind;
      }
      function rB(e) {
        return e.replace(/[- _]+/g, "").toLowerCase();
      }
      function rO(e, t) {
        return re(
          e,
          `Unclosed character class${t?.type === "Character" && 93 === t.value && "]" === t.raw ? ' (started with "]")' : ""}`,
        );
      }
      function rF(e) {
        return re(e, "Unclosed group");
      }
      function rD(e, t, r = null) {
        function n(e, t) {
          for (let r = 0; r < e.length; r++) {
            let n = s(e[r], t, r, e);
            r = Math.max(-1, r + n);
          }
        }
        function s(a, i = null, o = null, l = null) {
          let c = 0,
            u = !1,
            h = {
              node: a,
              parent: i,
              key: o,
              container: l,
              root: e,
              remove() {
                (rj(l).splice(Math.max(0, rU(o) + c), 1), c--, (u = !0));
              },
              removeAllNextSiblings: () => rj(l).splice(rU(o) + 1),
              removeAllPrevSiblings() {
                let e = rU(o) + c;
                return ((c -= e), rj(l).splice(0, Math.max(0, e)));
              },
              replaceWith(e, t = {}) {
                let r = !!t.traverse;
                (l
                  ? (l[Math.max(0, rU(o) + c)] = e)
                  : (re(i, "Can't replace root node")[o] = e),
                  r && s(e, i, o, l),
                  (u = !0));
              },
              replaceWithMultiple(e, t = {}) {
                let r = !!t.traverse;
                if (
                  (rj(l).splice(Math.max(0, rU(o) + c), 1, ...e),
                  (c += e.length - 1),
                  r)
                ) {
                  let t = 0;
                  for (let r = 0; r < e.length; r++)
                    t += s(e[r], i, rU(o) + r + t, l);
                }
                u = !0;
              },
              skip() {
                u = !0;
              },
            },
            { type: p } = a,
            d = t["*"],
            g = t[p],
            f = "function" == typeof d ? d : d?.enter,
            m = "function" == typeof g ? g : g?.enter;
          if ((f?.(h, r), m?.(h, r), !u))
            switch (p) {
              case "AbsenceFunction":
              case "Alternative":
              case "CapturingGroup":
              case "CharacterClass":
              case "Group":
              case "LookaroundAssertion":
                n(a.body, a);
                break;
              case "Assertion":
              case "Backreference":
              case "Character":
              case "CharacterSet":
              case "Directive":
              case "Flags":
              case "NamedCallout":
              case "Subroutine":
                break;
              case "CharacterClassRange":
                (s(a.min, a, "min"), s(a.max, a, "max"));
                break;
              case "Quantifier":
                s(a.body, a, "body");
                break;
              case "Regex":
                (n(a.body, a), s(a.flags, a, "flags"));
                break;
              default:
                throw Error(`Unexpected node type "${p}"`);
            }
          return (g?.exit?.(h, r), d?.exit?.(h, r), c);
        }
        return (s(e), e);
      }
      function rj(e) {
        if (!Array.isArray(e)) throw Error("Container expected");
        return e;
      }
      function rU(e) {
        if ("number" != typeof e) throw Error("Numeric key expected");
        return e;
      }
      let rW = String.raw`\(\?(?:[:=!>A-Za-z\-]|<[=!]|\(DEFINE\))`,
        rq = Object.freeze({ DEFAULT: "DEFAULT", CHAR_CLASS: "CHAR_CLASS" });
      function rz(e, t, r, n) {
        let s = RegExp(String.raw`${t}|(?<$skip>\[\^?|\\?.)`, "gsu"),
          a = [!1],
          i = 0,
          o = "";
        for (let t of e.matchAll(s)) {
          let {
            0: e,
            groups: { $skip: s },
          } = t;
          if (!s && (!n || (n === rq.DEFAULT) == !i)) {
            r instanceof Function
              ? (o += r(t, {
                  context: i ? rq.CHAR_CLASS : rq.DEFAULT,
                  negated: a[a.length - 1],
                }))
              : (o += r);
            continue;
          }
          ("[" === e[0]
            ? (i++, a.push("^" === e[1]))
            : "]" === e && i && (i--, a.pop()),
            (o += e));
        }
        return o;
      }
      function rH(e, t, r) {
        return !!(function (e, t, r = 0, n) {
          let s;
          if (!RegExp(t, "su").test(e)) return null;
          let a = RegExp(`${t}|(?<$skip>\\\\?.)`, "gsu");
          a.lastIndex = r;
          let i = 0;
          for (; (s = a.exec(e));) {
            let {
              0: e,
              groups: { $skip: t },
            } = s;
            if (!t && (!n || (n === rq.DEFAULT) == !i)) return s;
            ("[" === e ? i++ : "]" === e && i && i--,
              a.lastIndex == s.index && a.lastIndex++);
          }
          return null;
        })(e, t, 0, r);
      }
      let rV = RegExp(
          String.raw`(?<noncapturingStart>${rW})|(?<capturingStart>\((?:\?<[^>]+>)?)|\\?.`,
          "gsu",
        ),
        rX = String.raw`(?:[?*+]|\{\d+(?:,\d*)?\})`,
        rQ = RegExp(
          String.raw`
\\(?: \d+
  | c[A-Za-z]
  | [gk]<[^>]+>
  | [pPu]\{[^\}]+\}
  | u[A-Fa-f\d]{4}
  | x[A-Fa-f\d]{2}
  )
| \((?: \? (?: [:=!>]
  | <(?:[=!]|[^>]+>)
  | [A-Za-z\-]+:
  | \(DEFINE\)
  ))?
| (?<qBase>${rX})(?<qMod>[?+]?)(?<invalidQ>[?*+\{]?)
| \\?.
`.replace(/\s+/g, ""),
          "gsu",
        ),
        rZ = String.raw,
        rK = rZ`\\g<(?<gRNameOrNum>[^>&]+)&R=(?<gRDepth>[^>]+)>`,
        rY = rZ`\(\?R=(?<rDepth>[^\)]+)\)|${rK}`,
        rJ = rZ`\(\?<(?![=!])(?<captureName>[^>]+)>`,
        r0 = rZ`${rJ}|(?<unnamed>\()(?!\?)`,
        r1 = RegExp(rZ`${rJ}|${rY}|\(\?|\\?.`, "gsu"),
        r2 = "Cannot use multiple overlapping recursions";
      function r3(e) {
        let t = `Max depth must be integer between 2 and 100; used ${e}`;
        if (!/^[1-9]\d*$/.test(e) || (e *= 1) < 2 || e > 100) throw Error(t);
      }
      function r5(e, t, r, n, s, a, i) {
        let o = new Set();
        n &&
          rz(
            e + t,
            rJ,
            ({ groups: { captureName: e } }) => {
              o.add(e);
            },
            rq.DEFAULT,
          );
        let l = [r, n ? o : null, s, a, i];
        return `${e}${r8(`(?:${e}`, "forward", ...l)}(?:)${r8(`${t})`, "backward", ...l)}${t}`;
      }
      function r8(e, t, r, n, s, a, i) {
        let o = (e) => ("forward" === t ? e + 2 : r - e + 2 - 1),
          l = "";
        for (let t = 0; t < r; t++) {
          let r = o(t);
          l += rz(
            e,
            rZ`${r0}|\\k<(?<backref>[^>]+)>`,
            ({ 0: e, groups: { captureName: t, unnamed: o, backref: l } }) => {
              if (l && n && !n.has(l)) return e;
              let c = `_$${r}`;
              if (o || t) {
                let r = i + a.length + 1;
                return (
                  a.push(r),
                  (function (e, t) {
                    for (let r = 0; r < e.length; r++) e[r] >= t && e[r]++;
                  })(s, r),
                  o ? e : `(?<${t}${c}>`
                );
              }
              return rZ`\k<${l}${c}>`;
            },
            rq.DEFAULT,
          );
        }
        return l;
      }
      function r4(e, t, r, n, s, a) {
        if (e.size && n) {
          let i = 0;
          rz(t, r0, () => i++, rq.DEFAULT);
          let o = a - i + s,
            l = new Map();
          return (
            e.forEach((e, t) => {
              let s = (n - i * r) / r,
                a = i * r,
                c = t > o + i ? t + n : t,
                u = [];
              for (let t of e)
                if (t <= o) u.push(t);
                else if (t > o + i + s) u.push(t + n);
                else if (t <= o + i)
                  for (let e = 0; e <= r; e++) u.push(t + i * e);
                else for (let e = 0; e <= r; e++) u.push(t + a + s * e);
              l.set(c, u);
            }),
            l
          );
        }
        return e;
      }
      var r6 = String.fromCodePoint,
        r9 = String.raw,
        r7 = {},
        ne = globalThis.RegExp;
      function nt(e, { enable: t, disable: r }) {
        return {
          dotAll: !r?.dotAll && !!(t?.dotAll || e.dotAll),
          ignoreCase: !r?.ignoreCase && !!(t?.ignoreCase || e.ignoreCase),
        };
      }
      function nr(e, t, r) {
        return (e.has(t) || e.set(t, r), e.get(t));
      }
      ((r7.flagGroups = (() => {
        try {
          new ne("(?i:)");
        } catch {
          return !1;
        }
        return !0;
      })()),
        (r7.unicodeSets = (() => {
          try {
            new ne("[[]]", "v");
          } catch {
            return !1;
          }
          return !0;
        })()),
        (r7.bugFlagVLiteralHyphenIsRange =
          !!r7.unicodeSets &&
          (() => {
            try {
              new ne(r9`[\d\-a]`, "v");
            } catch {
              return !0;
            }
            return !1;
          })()),
        (r7.bugNestedClassIgnoresNegation =
          r7.unicodeSets && new ne("[[^a]]", "v").test("a")));
      var nn = { ES2025: 2025, ES2024: 2024, ES2018: 2018 },
        ns = {
          auto: "auto",
          ES2025: "ES2025",
          ES2024: "ES2024",
          ES2018: "ES2018",
        };
      function na(e = {}) {
        if ("[object Object]" !== {}.toString.call(e))
          throw Error("Unexpected options");
        if (void 0 !== e.target && !ns[e.target])
          throw Error(`Unexpected target "${e.target}"`);
        let t = {
          accuracy: "default",
          avoidSubclass: !1,
          flags: "",
          global: !1,
          hasIndices: !1,
          lazyCompileLength: 1 / 0,
          target: "auto",
          verbose: !1,
          ...e,
          rules: {
            allowOrphanBackrefs: !1,
            asciiWordBoundaries: !1,
            captureGroup: !1,
            recursionLimit: 20,
            singleline: !1,
            ...e.rules,
          },
        };
        return (
          "auto" === t.target &&
            (t.target = r7.flagGroups
              ? "ES2025"
              : r7.unicodeSets
                ? "ES2024"
                : "ES2018"),
          t
        );
      }
      var ni = new Set([r6(304), r6(305)]),
        no = r9`[\p{L}\p{M}\p{N}\p{Pc}]`;
      function nl(e) {
        if (ni.has(e)) return [e];
        let t = new Set(),
          r = e.toLowerCase(),
          n = r.toUpperCase(),
          s = np.get(r),
          a = nu.get(r),
          i = nh.get(r);
        return (
          1 == [...n].length && t.add(n),
          i && t.add(i),
          s && t.add(s),
          t.add(r),
          a && t.add(a),
          [...t]
        );
      }
      var nc = new Map(
          `C Other
Cc Control cntrl
Cf Format
Cn Unassigned
Co Private_Use
Cs Surrogate
L Letter
LC Cased_Letter
Ll Lowercase_Letter
Lm Modifier_Letter
Lo Other_Letter
Lt Titlecase_Letter
Lu Uppercase_Letter
M Mark Combining_Mark
Mc Spacing_Mark
Me Enclosing_Mark
Mn Nonspacing_Mark
N Number
Nd Decimal_Number digit
Nl Letter_Number
No Other_Number
P Punctuation punct
Pc Connector_Punctuation
Pd Dash_Punctuation
Pe Close_Punctuation
Pf Final_Punctuation
Pi Initial_Punctuation
Po Other_Punctuation
Ps Open_Punctuation
S Symbol
Sc Currency_Symbol
Sk Modifier_Symbol
Sm Math_Symbol
So Other_Symbol
Z Separator
Zl Line_Separator
Zp Paragraph_Separator
Zs Space_Separator
ASCII
ASCII_Hex_Digit AHex
Alphabetic Alpha
Any
Assigned
Bidi_Control Bidi_C
Bidi_Mirrored Bidi_M
Case_Ignorable CI
Cased
Changes_When_Casefolded CWCF
Changes_When_Casemapped CWCM
Changes_When_Lowercased CWL
Changes_When_NFKC_Casefolded CWKCF
Changes_When_Titlecased CWT
Changes_When_Uppercased CWU
Dash
Default_Ignorable_Code_Point DI
Deprecated Dep
Diacritic Dia
Emoji
Emoji_Component EComp
Emoji_Modifier EMod
Emoji_Modifier_Base EBase
Emoji_Presentation EPres
Extended_Pictographic ExtPict
Extender Ext
Grapheme_Base Gr_Base
Grapheme_Extend Gr_Ext
Hex_Digit Hex
IDS_Binary_Operator IDSB
IDS_Trinary_Operator IDST
ID_Continue IDC
ID_Start IDS
Ideographic Ideo
Join_Control Join_C
Logical_Order_Exception LOE
Lowercase Lower
Math
Noncharacter_Code_Point NChar
Pattern_Syntax Pat_Syn
Pattern_White_Space Pat_WS
Quotation_Mark QMark
Radical
Regional_Indicator RI
Sentence_Terminal STerm
Soft_Dotted SD
Terminal_Punctuation Term
Unified_Ideograph UIdeo
Uppercase Upper
Variation_Selector VS
White_Space space
XID_Continue XIDC
XID_Start XIDS`
            .split(/\s/)
            .map((e) => [rB(e), e]),
        ),
        nu = new Map([
          ["s", r6(383)],
          [r6(383), "s"],
        ]),
        nh = new Map([
          [r6(223), r6(7838)],
          [r6(107), r6(8490)],
          [r6(229), r6(8491)],
          [r6(969), r6(8486)],
        ]),
        np = new Map([
          ng(453),
          ng(456),
          ng(459),
          ng(498),
          ...nf(8072, 8079),
          ...nf(8088, 8095),
          ...nf(8104, 8111),
          ng(8124),
          ng(8140),
          ng(8188),
        ]),
        nd = new Map([
          ["alnum", r9`[\p{Alpha}\p{Nd}]`],
          ["alpha", r9`\p{Alpha}`],
          ["ascii", r9`\p{ASCII}`],
          ["blank", r9`[\p{Zs}\t]`],
          ["cntrl", r9`\p{Cc}`],
          ["digit", r9`\p{Nd}`],
          ["graph", r9`[\P{space}&&\P{Cc}&&\P{Cn}&&\P{Cs}]`],
          ["lower", r9`\p{Lower}`],
          ["print", r9`[[\P{space}&&\P{Cc}&&\P{Cn}&&\P{Cs}]\p{Zs}]`],
          ["punct", r9`[\p{P}\p{S}]`],
          ["space", r9`\p{space}`],
          ["upper", r9`\p{Upper}`],
          ["word", r9`[\p{Alpha}\p{M}\p{Nd}\p{Pc}]`],
          ["xdigit", r9`\p{AHex}`],
        ]);
      function ng(e) {
        let t = r6(e);
        return [t.toLowerCase(), t];
      }
      function nf(e, t) {
        return (function (e, t) {
          let r = [];
          for (let n = e; n <= t; n++) r.push(n);
          return r;
        })(e, t).map((e) => ng(e));
      }
      var nm = new Set([
          "Lower",
          "Lowercase",
          "Upper",
          "Uppercase",
          "Ll",
          "Lowercase_Letter",
          "Lt",
          "Titlecase_Letter",
          "Lu",
          "Uppercase_Letter",
        ]),
        ny = {
          AbsenceFunction({ node: e, parent: t, replaceWith: r }) {
            let { body: n, kind: s } = e;
            if ("repeater" === s) {
              let e = rE();
              e.body[0].body.push(rI({ negate: !0, body: n }), rP("Any"));
              let s = rE();
              (s.body[0].body.push(r$("greedy", 0, 1 / 0, e)),
                r(nI(s, t), { traverse: !0 }));
            } else throw Error('Unsupported absence function "(?~|"');
          },
          Alternative: {
            enter({ node: e, parent: t, key: r }, { flagDirectivesByAlt: n }) {
              let s = e.body.filter((e) => "flags" === e.kind);
              for (let e = r + 1; e < t.body.length; e++)
                nr(n, t.body[e], []).push(...s);
            },
            exit({ node: e }, { flagDirectivesByAlt: t }) {
              if (t.get(e)?.length) {
                let r = nS(t.get(e));
                if (r) {
                  let t = rE({ flags: r });
                  ((t.body[0].body = e.body), (e.body = [nI(t, e)]));
                }
              }
            },
          },
          Assertion(
            {
              node: e,
              parent: t,
              key: r,
              container: n,
              root: s,
              remove: a,
              replaceWith: i,
            },
            o,
          ) {
            let { kind: l, negate: c } = e,
              {
                asciiWordBoundaries: u,
                avoidSubclass: h,
                supportedGNodes: p,
                wordIsAscii: d,
              } = o;
            if ("text_segment_boundary" === l)
              throw Error(
                `Unsupported text segment boundary "\\${c ? "Y" : "y"}"`,
              );
            if ("line_end" === l)
              i(
                nI(
                  rI({
                    body: [
                      rw({ body: [rC("string_end")] }),
                      rw({ body: [rv(10)] }),
                    ],
                  }),
                  t,
                ),
              );
            else if ("line_start" === l)
              i(
                nI(
                  nA(r9`(?<=\A|\n(?!\z))`, { skipLookbehindValidation: !0 }),
                  t,
                ),
              );
            else if ("search_start" === l)
              if (p.has(e)) ((s.flags.sticky = !0), a());
              else {
                var g;
                let e,
                  s = n[r - 1];
                if (
                  s &&
                  ((e = [
                    "Character",
                    "CharacterClass",
                    "CharacterSet",
                  ]).includes((g = s).type) ||
                    ("Quantifier" === g.type &&
                      g.min &&
                      e.includes(g.body.type)))
                )
                  i(nI(rI({ negate: !0 }), t));
                else if (h)
                  throw Error(r9`Uses "\G" in a way that requires a subclass`);
                else
                  (i(nE(rC("string_start"), t)), (o.strategy = "clip_search"));
              }
            else if ("string_end" === l || "string_start" === l);
            else if ("string_end_newline" === l) i(nI(nA(r9`(?=\n?\z)`), t));
            else if ("word_boundary" === l) {
              if (!d && !u) {
                let e = `(?:(?<=${no})(?!${no})|(?<!${no})(?=${no}))`,
                  r = `(?:(?<=${no})(?=${no})|(?<!${no})(?!${no}))`;
                i(nI(nA(c ? r : e), t));
              }
            } else throw Error(`Unexpected assertion kind "${l}"`);
          },
          Backreference({ node: e }, { jsGroupNameMap: t }) {
            let { ref: r } = e;
            "string" != typeof r || nv(r) || (e.ref = r = nC(r, t));
          },
          CapturingGroup(
            { node: e },
            { jsGroupNameMap: t, subroutineRefMap: r },
          ) {
            let { name: n } = e;
            (n && !nv(n) && (e.name = n = nC(n, t)),
              r.set(e.number, e),
              n && r.set(n, e));
          },
          CharacterClassRange({ node: e, parent: t, replaceWith: r }) {
            "intersection" === t.kind &&
              r(nI(rA({ body: [e] }), t), { traverse: !0 });
          },
          CharacterSet(
            { node: e, parent: t, replaceWith: r },
            {
              accuracy: n,
              minTargetEs2024: s,
              digitIsAscii: a,
              spaceIsAscii: i,
              wordIsAscii: o,
            },
          ) {
            let { kind: l, negate: c, value: u } = e;
            if (a && ("digit" === l || "digit" === u))
              return void r(nE(rN("digit", { negate: c }), t));
            if (i && ("space" === l || "space" === u))
              return void r(nI(nN(nA("[	-\r ]"), c), t));
            if (o && ("word" === l || "word" === u))
              return void r(nE(rN("word", { negate: c }), t));
            if ("any" === l) r(nE(rP("Any"), t));
            else if ("digit" === l) r(nE(rP("Nd", { negate: c }), t));
            else if ("dot" === l);
            else if ("text_segment" === l) {
              if ("strict" === n)
                throw Error(r9`Use of "\X" requires non-strict accuracy`);
              let e =
                  "\\p{Emoji}(?:\\p{EMod}|\\uFE0F\\u20E3?|[\\x{E0020}-\\x{E007E}]+\\x{E007F})?",
                a = r9`\p{RI}{2}|${e}(?:\u200D${e})*`;
              r(
                nI(
                  nA(r9`(?>\r\n|${s ? r9`\p{RGI_Emoji}` : a}|\P{M}\p{M}*)`, {
                    skipPropertyNameValidation: !0,
                  }),
                  t,
                ),
              );
            } else if ("hex" === l) r(nE(rP("AHex", { negate: c }), t));
            else if ("newline" === l)
              r(nI(nA(c ? "[^\n]" : "(?>\r\n?|[\n\v\f\u2028\u2029])"), t));
            else if ("posix" === l)
              if (s || ("graph" !== u && "print" !== u))
                r(nI(nN(nA(nd.get(u)), c), t));
              else {
                if ("strict" === n)
                  throw Error(
                    `POSIX class "${u}" requires min target ES2024 or non-strict accuracy`,
                  );
                let e = { graph: "!-~", print: " -~" }[u];
                (c &&
                  (e = `\0-${r6(e.codePointAt(0) - 1)}${r6(e.codePointAt(2) + 1)}-􏿿`),
                  r(nI(nA(`[${e}]`), t)));
              }
            else if ("property" === l) nc.has(rB(u)) || (e.key = "sc");
            else if ("space" === l) r(nE(rP("space", { negate: c }), t));
            else if ("word" === l) r(nI(nN(nA(no), c), t));
            else throw Error(`Unexpected character set kind "${l}"`);
          },
          Directive({
            node: e,
            parent: t,
            root: r,
            remove: n,
            replaceWith: s,
            removeAllPrevSiblings: a,
            removeAllNextSiblings: i,
          }) {
            let { kind: o, flags: l } = e;
            if ("flags" === o)
              if (l.enable || l.disable) {
                let e = rE({ flags: l });
                ((e.body[0].body = i()), s(nI(e, t), { traverse: !0 }));
              } else n();
            else if ("keep" === o) {
              let e = r.body[0],
                n =
                  1 === r.body.length &&
                  rb(e, { type: "Group" }) &&
                  1 === e.body[0].body.length
                    ? e.body[0]
                    : r;
              if (t.parent !== n || n.body.length > 1)
                throw Error(r9`Uses "\K" in a way that's unsupported`);
              let i = rI({ behind: !0 });
              ((i.body[0].body = a()), s(nI(i, t)));
            } else throw Error(`Unexpected directive kind "${o}"`);
          },
          Flags({ node: e, parent: t }) {
            if (e.posixIsAscii) throw Error('Unsupported flag "P"');
            if ("word" === e.textSegmentMode)
              throw Error('Unsupported flag "y{w}"');
            ([
              "digitIsAscii",
              "extended",
              "posixIsAscii",
              "spaceIsAscii",
              "wordIsAscii",
              "textSegmentMode",
            ].forEach((t) => delete e[t]),
              Object.assign(e, {
                global: !1,
                hasIndices: !1,
                multiline: !1,
                sticky: e.sticky ?? !1,
              }),
              (t.options = { disable: { x: !0, n: !0 }, force: { v: !0 } }));
          },
          Group({ node: e }) {
            if (!e.flags) return;
            let { enable: t, disable: r } = e.flags;
            (t?.extended && delete t.extended,
              r?.extended && delete r.extended,
              t?.dotAll && r?.dotAll && delete t.dotAll,
              t?.ignoreCase && r?.ignoreCase && delete t.ignoreCase,
              t && !Object.keys(t).length && delete e.flags.enable,
              r && !Object.keys(r).length && delete e.flags.disable,
              e.flags.enable || e.flags.disable || delete e.flags);
          },
          LookaroundAssertion({ node: e }, t) {
            let { kind: r } = e;
            "lookbehind" === r && (t.passedLookbehind = !0);
          },
          NamedCallout({ node: e, parent: t, replaceWith: r }) {
            let { kind: n } = e;
            if ("fail" === n) r(nI(rI({ negate: !0 }), t));
            else
              throw Error(`Unsupported named callout "(*${n.toUpperCase()}"`);
          },
          Quantifier({ node: e }) {
            if ("Quantifier" === e.body.type) {
              let t = rE();
              (t.body[0].body.push(e.body), (e.body = nI(t, e)));
            }
          },
          Regex: {
            enter({ node: e }, { supportedGNodes: t }) {
              let r = [],
                n = !1,
                s = !1;
              for (let t of e.body)
                if (1 === t.body.length && "search_start" === t.body[0].kind)
                  t.body.pop();
                else {
                  let e = (function e(t) {
                    let r = t.find(
                      (e) =>
                        "search_start" === e.kind ||
                        (function (e, t) {
                          let r = { negate: null, ...t };
                          return (
                            "LookaroundAssertion" === e.type &&
                            (null === r.negate || e.negate === r.negate) &&
                            1 === e.body.length &&
                            rb(e.body[0], {
                              type: "Assertion",
                              kind: "search_start",
                            })
                          );
                        })(e, { negate: !1 }) ||
                        !(function ({ type: e }) {
                          return (
                            "Assertion" === e ||
                            "Directive" === e ||
                            "LookaroundAssertion" === e
                          );
                        })(e),
                    );
                    if (!r) return null;
                    if ("search_start" === r.kind) return r;
                    if ("LookaroundAssertion" === r.type)
                      return r.body[0].body[0];
                    if ("CapturingGroup" === r.type || "Group" === r.type) {
                      let t = [];
                      for (let n of r.body) {
                        let r = e(n.body);
                        if (!r) return null;
                        Array.isArray(r) ? t.push(...r) : t.push(r);
                      }
                      return t;
                    }
                    return null;
                  })(t.body);
                  e
                    ? ((n = !0), Array.isArray(e) ? r.push(...e) : r.push(e))
                    : (s = !0);
                }
              n && !s && r.forEach((e) => t.add(e));
            },
            exit(e, { accuracy: t, passedLookbehind: r, strategy: n }) {
              if ("strict" === t && r && n)
                throw Error(
                  r9`Uses "\G" in a way that requires non-strict accuracy`,
                );
            },
          },
          Subroutine({ node: e }, { jsGroupNameMap: t }) {
            let { ref: r } = e;
            "string" != typeof r || nv(r) || (e.ref = r = nC(r, t));
          },
        },
        nb = {
          Backreference(
            { node: e },
            { multiplexCapturesToLeftByRef: t, reffedNodesByReferencer: r },
          ) {
            let { orphan: n, ref: s } = e;
            n || r.set(e, [...t.get(s).map(({ node: e }) => e)]);
          },
          CapturingGroup: {
            enter(
              { node: e, parent: t, replaceWith: r, skip: n },
              {
                groupOriginByCopy: s,
                groupsByName: a,
                multiplexCapturesToLeftByRef: i,
                openRefs: o,
                reffedNodesByReferencer: l,
              },
            ) {
              let c = s.get(e);
              if (c && o.has(e.number)) {
                let n = nE(nw(e.number), t);
                (l.set(n, o.get(e.number)), r(n));
                return;
              }
              (o.set(e.number, e),
                i.set(e.number, []),
                e.name && nr(i, e.name, []));
              let u = i.get(e.name ?? e.number);
              for (let t = 0; t < u.length; t++) {
                let r = u[t];
                if (c === r.node || (c && c === r.origin) || e === r.origin) {
                  u.splice(t, 1);
                  break;
                }
              }
              if (
                (i.get(e.number).push({ node: e, origin: c }),
                e.name && i.get(e.name).push({ node: e, origin: c }),
                e.name)
              ) {
                let t = nr(a, e.name, new Map()),
                  r = !1;
                if (c) r = !0;
                else
                  for (let e of t.values())
                    if (!e.hasDuplicateNameToRemove) {
                      r = !0;
                      break;
                    }
                a.get(e.name).set(e, { node: e, hasDuplicateNameToRemove: r });
              }
            },
            exit({ node: e }, { openRefs: t }) {
              t.get(e.number) === e && t.delete(e.number);
            },
          },
          Group: {
            enter({ node: e }, t) {
              ((t.prevFlags = t.currentFlags),
                e.flags && (t.currentFlags = nt(t.currentFlags, e.flags)));
            },
            exit(e, t) {
              t.currentFlags = t.prevFlags;
            },
          },
          Subroutine({ node: e, parent: t, replaceWith: r }, n) {
            let { isRecursive: s, ref: a } = e;
            if (s) {
              let r = t;
              for (
                ;
                (r = r.parent) &&
                ("CapturingGroup" !== r.type ||
                  (r.name !== a && r.number !== a));
              );
              n.reffedNodesByReferencer.set(e, r);
              return;
            }
            let i = n.subroutineRefMap.get(a),
              o = 0 === a,
              l = o
                ? nw(0)
                : (function e(t, r, n, s) {
                    let a = Array.isArray(t) ? [] : {};
                    for (let [i, o] of Object.entries(t))
                      "parent" === i
                        ? (a.parent = Array.isArray(n) ? s : n)
                        : o && "object" == typeof o
                          ? (a[i] = e(o, r, a, n))
                          : ("type" === i &&
                              "CapturingGroup" === o &&
                              r.set(a, r.get(t) ?? t),
                            (a[i] = o));
                    return a;
                  })(i, n.groupOriginByCopy, null),
              c = l;
            if (!o) {
              var u, h;
              let e = nS(
                  (function (e, t) {
                    let r = [];
                    for (; (e = e.parent);) (!t || t(e)) && r.push(e);
                    return r;
                  })(i, (e) => "Group" === e.type && !!e.flags),
                ),
                t = e ? nt(n.globalFlags, e) : n.globalFlags;
              ((u = t),
                (h = n.currentFlags),
                (u.dotAll !== h.dotAll || u.ignoreCase !== h.ignoreCase) &&
                  (c = rE({
                    flags: (function ({ dotAll: e, ignoreCase: t }) {
                      let r = {};
                      return (
                        (e || t) &&
                          ((r.enable = {}),
                          e && (r.enable.dotAll = !0),
                          t && (r.enable.ignoreCase = !0)),
                        (e && t) ||
                          ((r.disable = {}),
                          e || (r.disable.dotAll = !0),
                          t || (r.disable.ignoreCase = !0)),
                        r
                      );
                    })(t),
                  })).body[0].body.push(l));
            }
            r(nI(c, t), { traverse: !o });
          },
        },
        n_ = {
          Backreference({ node: e, parent: t, replaceWith: r }, n) {
            if (e.orphan) {
              n.highestOrphanBackref = Math.max(n.highestOrphanBackref, e.ref);
              return;
            }
            let s = n.reffedNodesByReferencer.get(e).filter((t) =>
              (function (e, t) {
                let r = t;
                do {
                  if ("Regex" === r.type) return !1;
                  if ("Alternative" === r.type) continue;
                  if (r === e) return !1;
                  for (let t of nx(r.parent)) {
                    if (t === r) break;
                    if (
                      t === e ||
                      (function e(t, r) {
                        for (let n of nx(t) ?? [])
                          if (n === r || e(n, r)) return !0;
                        return !1;
                      })(t, e)
                    )
                      return !0;
                  }
                } while ((r = r.parent));
                throw Error("Unexpected path");
              })(t, e),
            );
            s.length
              ? s.length > 1
                ? r(
                    nI(
                      rE({
                        atomic: !0,
                        body: s
                          .reverse()
                          .map((e) => rw({ body: [rS(e.number)] })),
                      }),
                      t,
                    ),
                  )
                : (e.ref = s[0].number)
              : r(nI(rI({ negate: !0 }), t));
          },
          CapturingGroup({ node: e }, t) {
            ((e.number = ++t.numCapturesToLeft),
              e.name &&
                t.groupsByName.get(e.name).get(e).hasDuplicateNameToRemove &&
                delete e.name);
          },
          Regex: {
            exit({ node: e }, t) {
              let r = Math.max(t.highestOrphanBackref - t.numCapturesToLeft, 0);
              for (let t = 0; t < r; t++) {
                let t = rx();
                e.body.at(-1).body.push(t);
              }
            },
          },
          Subroutine({ node: e }, t) {
            e.isRecursive &&
              0 !== e.ref &&
              (e.ref = t.reffedNodesByReferencer.get(e).number);
          },
        };
      function nk(e) {
        rD(e, {
          "*"({ node: e, parent: t }) {
            e.parent = t;
          },
        });
      }
      function nw(e) {
        let t = rL(e);
        return ((t.isRecursive = !0), t);
      }
      function nC(e, t) {
        if (t.has(e)) return t.get(e);
        let r = `$${t.size}_${e.replace(/^[^$_\p{IDS}]|[^$\u200C\u200D\p{IDC}]/gu, "_")}`;
        return (t.set(e, r), r);
      }
      function nS(e) {
        let t = ["dotAll", "ignoreCase"],
          r = { enable: {}, disable: {} };
        return (e.forEach(({ flags: e }) => {
          t.forEach((t) => {
            (e.enable?.[t] && (delete r.disable[t], (r.enable[t] = !0)),
              e.disable?.[t] && (r.disable[t] = !0));
          });
        }),
        Object.keys(r.enable).length || delete r.enable,
        Object.keys(r.disable).length || delete r.disable,
        r.enable || r.disable)
          ? r
          : null;
      }
      function nx(e) {
        if (!e) throw Error("Node expected");
        let { body: t } = e;
        return Array.isArray(t) ? t : t ? [t] : null;
      }
      function nv(e) {
        return /^[$_\p{IDS}][$\u200C\u200D\p{IDC}]*$/u.test(e);
      }
      function nA(e, t) {
        let r = rk(e, { ...t, unicodePropertyMap: nc }).body;
        return r.length > 1 || r[0].body.length > 1
          ? rE({ body: r })
          : r[0].body[0];
      }
      function nN(e, t) {
        return ((e.negate = t), e);
      }
      function nE(e, t) {
        return ((e.parent = t), e);
      }
      function nI(e, t) {
        return (nk(e), (e.parent = t), e);
      }
      var n$ = {
          "*": {
            enter({ node: e }, t) {
              if (nD(e)) {
                let r = t.getCurrentModI();
                t.pushModI(
                  e.flags ? nt({ ignoreCase: r }, e.flags).ignoreCase : r,
                );
              }
            },
            exit({ node: e }, t) {
              nD(e) && t.popModI();
            },
          },
          Backreference(e, t) {
            t.setHasCasedChar();
          },
          Character({ node: e }, t) {
            nB(r6(e.value)) && t.setHasCasedChar();
          },
          CharacterClassRange({ node: e, skip: t }, r) {
            (t(), nO(e, { firstOnly: !0 }).length && r.setHasCasedChar());
          },
          CharacterSet({ node: e }, t) {
            "property" === e.kind && nm.has(e.value) && t.setHasCasedChar();
          },
        },
        nL = {
          Alternative: ({ body: e }, t, r) => e.map(r).join(""),
          Assertion({ kind: e, negate: t }) {
            if ("string_end" === e) return "$";
            if ("string_start" === e) return "^";
            if ("word_boundary" === e) return t ? r9`\B` : r9`\b`;
            throw Error(`Unexpected assertion kind "${e}"`);
          },
          Backreference({ ref: e }, t) {
            if ("number" != typeof e)
              throw Error("Unexpected named backref in transformed AST");
            if (
              !t.useFlagMods &&
              "strict" === t.accuracy &&
              t.currentFlags.ignoreCase &&
              !t.captureMap.get(e).ignoreCase
            )
              throw Error(
                "Use of case-insensitive backref to case-sensitive group requires target ES2025 or non-strict accuracy",
              );
            return "\\" + e;
          },
          CapturingGroup(e, t, r) {
            let { body: n, name: s, number: a } = e,
              i = { ignoreCase: t.currentFlags.ignoreCase },
              o = t.originMap.get(e);
            return (
              o && ((i.hidden = !0), a > o.number && (i.transferTo = o.number)),
              t.captureMap.set(a, i),
              `(${s ? `?<${s}>` : ""}${n.map(r).join("|")})`
            );
          },
          Character({ value: e }, t) {
            let r = r6(e),
              n = nF(e, {
                escDigit: "Backreference" === t.lastNode.type,
                inCharClass: t.inCharClass,
                useFlagV: t.useFlagV,
              });
            if (n !== r) return n;
            if (t.useAppliedIgnoreCase && t.currentFlags.ignoreCase && nB(r)) {
              let e = nl(r);
              return t.inCharClass
                ? e.join("")
                : e.length > 1
                  ? `[${e.join("")}]`
                  : e[0];
            }
            return r;
          },
          CharacterClass(e, t, r) {
            let { kind: n, negate: s, parent: a } = e,
              { body: i } = e;
            if ("intersection" === n && !t.useFlagV)
              throw Error(
                "Use of character class intersection requires min target ES2024",
              );
            r7.bugFlagVLiteralHyphenIsRange &&
              t.useFlagV &&
              i.some(nj) &&
              (i = [rv(45), ...i.filter((e) => !nj(e))]);
            let o = () =>
              `[${s ? "^" : ""}${i.map(r).join("intersection" === n ? "&&" : "")}]`;
            if (!t.inCharClass) {
              if ((!t.useFlagV || r7.bugNestedClassIgnoresNegation) && !s) {
                let t = i.filter(
                  (e) =>
                    "CharacterClass" === e.type &&
                    "union" === e.kind &&
                    e.negate,
                );
                if (t.length) {
                  let n = rE(),
                    s = n.body[0];
                  return (
                    (n.parent = a),
                    (s.parent = n),
                    (e.body = i = i.filter((e) => !t.includes(e))),
                    i.length ? ((e.parent = s), s.body.push(e)) : n.body.pop(),
                    t.forEach((e) => {
                      let t = rw({ body: [e] });
                      ((e.parent = t), (t.parent = n), n.body.push(t));
                    }),
                    r(n)
                  );
                }
              }
              t.inCharClass = !0;
              let n = o();
              return ((t.inCharClass = !1), n);
            }
            let l = i[0];
            if (
              "union" === n &&
              !s &&
              l &&
              (((!t.useFlagV || !t.verbose) &&
                "union" === a.kind &&
                !(r7.bugFlagVLiteralHyphenIsRange && t.useFlagV)) ||
                (!t.verbose &&
                  "intersection" === a.kind &&
                  1 === i.length &&
                  "CharacterClassRange" !== l.type))
            )
              return i.map(r).join("");
            if (!t.useFlagV && "CharacterClass" === a.type)
              throw Error(
                "Uses nested character class in a way that requires min target ES2024",
              );
            return o();
          },
          CharacterClassRange(e, t) {
            let r = e.min.value,
              n = e.max.value,
              s = { escDigit: !1, inCharClass: !0, useFlagV: t.useFlagV },
              a = nF(r, s),
              i = nF(n, s),
              o = new Set();
            return (
              t.useAppliedIgnoreCase &&
                t.currentFlags.ignoreCase &&
                (function (e) {
                  let t = e.map((e) => e.codePointAt(0)).sort((e, t) => e - t),
                    r = [],
                    n = null;
                  for (let e = 0; e < t.length; e++)
                    t[e + 1] === t[e] + 1
                      ? (n ??= t[e])
                      : null === n
                        ? r.push(t[e])
                        : (r.push([n, t[e]]), (n = null));
                  return r;
                })(nO(e)).forEach((e) => {
                  o.add(
                    Array.isArray(e)
                      ? `${nF(e[0], s)}-${nF(e[1], s)}`
                      : nF(e, s),
                  );
                }),
              `${a}-${i}${[...o].join("")}`
            );
          },
          CharacterSet({ kind: e, negate: t, value: r, key: n }, s) {
            if ("dot" === e)
              return s.currentFlags.dotAll
                ? s.appliedGlobalFlags.dotAll || s.useFlagMods
                  ? "."
                  : "[^]"
                : r9`[^\n]`;
            if ("digit" === e) return t ? r9`\D` : r9`\d`;
            if ("property" === e) {
              if (
                s.useAppliedIgnoreCase &&
                s.currentFlags.ignoreCase &&
                nm.has(r)
              )
                throw Error(
                  `Unicode property "${r}" can't be case-insensitive when other chars have specific case`,
                );
              return `${t ? r9`\P` : r9`\p`}{${n ? `${n}=` : ""}${r}}`;
            }
            if ("word" === e) return t ? r9`\W` : r9`\w`;
            throw Error(`Unexpected character set kind "${e}"`);
          },
          Flags: (e, t) =>
            (t.appliedGlobalFlags.ignoreCase ? "i" : "") +
            (e.dotAll ? "s" : "") +
            (e.sticky ? "y" : ""),
          Group({ atomic: e, body: t, flags: r, parent: n }, s, a) {
            let i = s.currentFlags;
            r && (s.currentFlags = nt(i, r));
            let o = t.map(a).join("|"),
              l =
                s.verbose ||
                1 !== t.length ||
                "Quantifier" === n.type ||
                e ||
                (s.useFlagMods && r)
                  ? `(?${(function (e, t, r) {
                      if (e) return ">";
                      let n = "";
                      if (t && r) {
                        let { enable: e, disable: r } = t;
                        n =
                          (e?.ignoreCase ? "i" : "") +
                          (e?.dotAll ? "s" : "") +
                          (r ? "-" : "") +
                          (r?.ignoreCase ? "i" : "") +
                          (r?.dotAll ? "s" : "");
                      }
                      return `${n}:`;
                    })(e, r, s.useFlagMods)}${o})`
                  : o;
            return ((s.currentFlags = i), l);
          },
          LookaroundAssertion({ body: e, kind: t, negate: r }, n, s) {
            let a = `${"lookahead" === t ? "" : "<"}${r ? "!" : "="}`;
            return `(?${a}${e.map(s).join("|")})`;
          },
          Quantifier: (e, t, r) =>
            r(e.body) +
            (function ({ kind: e, max: t, min: r }) {
              return (
                (r || 1 !== t
                  ? r || 1 / 0 !== t
                    ? 1 === r && 1 / 0 === t
                      ? "+"
                      : r === t
                        ? `{${r}}`
                        : `{${r},${1 / 0 === t ? "" : t}}`
                    : "*"
                  : "?") + { greedy: "", lazy: "?", possessive: "+" }[e]
              );
            })(e),
          Subroutine({ isRecursive: e, ref: t }, r) {
            if (!e)
              throw Error(
                "Unexpected non-recursive subroutine in transformed AST",
              );
            let n = r.recursionLimit;
            return 0 === t ? `(?R=${n})` : r9`\g<${t}&R=${n}>`;
          },
        },
        nP = new Set([
          "$",
          "(",
          ")",
          "*",
          "+",
          ".",
          "?",
          "[",
          "\\",
          "]",
          "^",
          "{",
          "|",
          "}",
        ]),
        nR = new Set(["-", "\\", "]", "^", "["]),
        nT = new Set([
          "(",
          ")",
          "-",
          "/",
          "[",
          "\\",
          "]",
          "^",
          "{",
          "|",
          "}",
          "!",
          "#",
          "$",
          "%",
          "&",
          "*",
          "+",
          ",",
          ".",
          ":",
          ";",
          "<",
          "=",
          ">",
          "?",
          "@",
          "`",
          "~",
        ]),
        nM = new Map([
          [9, r9`\t`],
          [10, r9`\n`],
          [11, r9`\v`],
          [12, r9`\f`],
          [13, r9`\r`],
          [8232, r9`\u2028`],
          [8233, r9`\u2029`],
          [65279, r9`\uFEFF`],
        ]),
        nG = /^\p{Cased}$/u;
      function nB(e) {
        return nG.test(e);
      }
      function nO(e, t) {
        let r = !!t?.firstOnly,
          n = e.min.value,
          s = e.max.value,
          a = [];
        if (
          (n < 65 && (65535 === s || s >= 131071)) ||
          (65536 === n && s >= 131071)
        )
          return a;
        for (let e = n; e <= s; e++) {
          let t = r6(e);
          if (!nB(t)) continue;
          let i = nl(t).filter((e) => {
            let t = e.codePointAt(0);
            return t < n || t > s;
          });
          if (i.length && (a.push(...i), r)) break;
        }
        return a;
      }
      function nF(e, { escDigit: t, inCharClass: r, useFlagV: n }) {
        var s;
        if (nM.has(e)) return nM.get(e);
        if (
          e < 32 ||
          (e > 126 && e < 160) ||
          e > 262143 ||
          (t && (s = e) > 47 && s < 58)
        )
          return e > 255
            ? `\\u{${e.toString(16).toUpperCase()}}`
            : `\\x${e.toString(16).toUpperCase().padStart(2, "0")}`;
        let a = r6(e);
        return ((r ? (n ? nT : nR) : nP).has(a) ? "\\" : "") + a;
      }
      function nD({ type: e }) {
        return (
          "CapturingGroup" === e || "Group" === e || "LookaroundAssertion" === e
        );
      }
      function nj({ type: e, value: t }) {
        return "Character" === e && 45 === t;
      }
      var nU = class e extends RegExp {
        #e = new Map();
        #t = null;
        #r;
        #n = null;
        #s = null;
        rawOptions = {};
        get source() {
          return this.#r || "(?:)";
        }
        constructor(t, r, n) {
          let s = !!n?.lazyCompile;
          if (t instanceof RegExp) {
            if (n) throw Error("Cannot provide options when copying a regexp");
            (super(t, r),
              (this.#r = t.source),
              t instanceof e &&
                ((this.#e = t.#e),
                (this.#n = t.#n),
                (this.#s = t.#s),
                (this.rawOptions = t.rawOptions)));
          } else {
            let e = { hiddenCaptures: [], strategy: null, transfers: [], ...n };
            (super(s ? "" : t, r),
              (this.#r = t),
              (this.#e = (function (e, t) {
                let r = new Map();
                for (let t of e) r.set(t, { hidden: !0 });
                for (let [e, n] of t)
                  for (let t of n) nr(r, t, {}).transferTo = e;
                return r;
              })(e.hiddenCaptures, e.transfers)),
              (this.#s = e.strategy),
              (this.rawOptions = n ?? {}));
          }
          s || (this.#t = this);
        }
        exec(t) {
          if (!this.#t) {
            let { lazyCompile: t, ...r } = this.rawOptions;
            this.#t = new e(this.#r, this.flags, r);
          }
          let r = this.global || this.sticky,
            n = this.lastIndex;
          if ("clip_search" === this.#s && r && n) {
            this.lastIndex = 0;
            let e = this.#a(t.slice(n));
            return (
              e &&
                ((function (e, t, r, n) {
                  if (((e.index += t), (e.input = r), n)) {
                    let r = e.indices;
                    for (let e = 0; e < r.length; e++) {
                      let n = r[e];
                      n && (r[e] = [n[0] + t, n[1] + t]);
                    }
                    let n = r.groups;
                    n &&
                      Object.keys(n).forEach((e) => {
                        let r = n[e];
                        r && (n[e] = [r[0] + t, r[1] + t]);
                      });
                  }
                })(e, n, t, this.hasIndices),
                (this.lastIndex += n)),
              e
            );
          }
          return this.#a(t);
        }
        #a(e) {
          let t;
          this.#t.lastIndex = this.lastIndex;
          let r = super.exec.call(this.#t, e);
          if (((this.lastIndex = this.#t.lastIndex), !r || !this.#e.size))
            return r;
          let n = [...r];
          ((r.length = 1),
            this.hasIndices && ((t = [...r.indices]), (r.indices.length = 1)));
          let s = [0];
          for (let e = 1; e < n.length; e++) {
            let { hidden: a, transferTo: i } = this.#e.get(e) ?? {};
            if (
              (a
                ? s.push(null)
                : (s.push(r.length),
                  r.push(n[e]),
                  this.hasIndices && r.indices.push(t[e])),
              i && void 0 !== n[e])
            ) {
              let a = s[i];
              if (!a) throw Error(`Invalid capture transfer to "${a}"`);
              if (
                ((r[a] = n[e]),
                this.hasIndices && (r.indices[a] = t[e]),
                r.groups)
              ) {
                this.#n ||
                  (this.#n = (function (e) {
                    let t,
                      r =
                        /(?<capture>\((?:\?<(?![=!])(?<name>[^>]+)>|(?!\?)))|\\?./gsu,
                      n = new Map(),
                      s = 0,
                      a = 0;
                    for (; (t = r.exec(e));) {
                      let {
                        0: e,
                        groups: { capture: r, name: i },
                      } = t;
                      "[" === e
                        ? s++
                        : s
                          ? "]" === e && s--
                          : r && (a++, i && n.set(a, i));
                    }
                    return n;
                  })(this.source));
                let s = this.#n.get(i);
                s &&
                  ((r.groups[s] = n[e]),
                  this.hasIndices && (r.indices.groups[s] = t[e]));
              }
            }
          }
          return r;
        }
      };
      e.s(
        [
          "f",
          0,
          function (e = {}) {
            let t = { target: "auto", cache: new Map(), ...e };
            return (
              (t.regexConstructor ||= (e) => {
                let r;
                return (r = (function (e, t) {
                  var r;
                  let n,
                    s,
                    a,
                    i,
                    o = na(t),
                    l =
                      ((r = rk(e, {
                        flags: o.flags,
                        normalizeUnknownPropertyNames: !0,
                        rules: {
                          captureGroup: o.rules.captureGroup,
                          singleline: o.rules.singleline,
                        },
                        skipBackrefValidation: o.rules.allowOrphanBackrefs,
                        unicodePropertyMap: nc,
                      })),
                      (n = {
                        accuracy: "default",
                        asciiWordBoundaries: !1,
                        avoidSubclass: !1,
                        bestEffortTarget: "ES2025",
                        ...{
                          accuracy: o.accuracy,
                          asciiWordBoundaries: o.rules.asciiWordBoundaries,
                          avoidSubclass: o.avoidSubclass,
                          bestEffortTarget: o.target,
                        },
                      }),
                      nk(r),
                      (s = {
                        accuracy: n.accuracy,
                        asciiWordBoundaries: n.asciiWordBoundaries,
                        avoidSubclass: n.avoidSubclass,
                        flagDirectivesByAlt: new Map(),
                        jsGroupNameMap: new Map(),
                        minTargetEs2024: nn[n.bestEffortTarget] >= nn.ES2024,
                        passedLookbehind: !1,
                        strategy: null,
                        subroutineRefMap: new Map(),
                        supportedGNodes: new Set(),
                        digitIsAscii: r.flags.digitIsAscii,
                        spaceIsAscii: r.flags.spaceIsAscii,
                        wordIsAscii: r.flags.wordIsAscii,
                      }),
                      rD(r, ny, s),
                      (i = {
                        currentFlags: (a = {
                          dotAll: r.flags.dotAll,
                          ignoreCase: r.flags.ignoreCase,
                        }),
                        prevFlags: null,
                        globalFlags: a,
                        groupOriginByCopy: new Map(),
                        groupsByName: new Map(),
                        multiplexCapturesToLeftByRef: new Map(),
                        openRefs: new Map(),
                        reffedNodesByReferencer: new Map(),
                        subroutineRefMap: s.subroutineRefMap,
                      }),
                      rD(r, nb, i),
                      rD(r, n_, {
                        groupsByName: i.groupsByName,
                        highestOrphanBackref: 0,
                        numCapturesToLeft: 0,
                        reffedNodesByReferencer: i.reffedNodesByReferencer,
                      }),
                      (r._originMap = i.groupOriginByCopy),
                      (r._strategy = s.strategy),
                      r),
                    c = (function (e, t) {
                      let r = na(t),
                        n = nn[r.target] >= nn.ES2024,
                        s = nn[r.target] >= nn.ES2025,
                        a = r.rules.recursionLimit;
                      if (!Number.isInteger(a) || a < 2 || a > 20)
                        throw Error("Invalid recursionLimit; use 2-20");
                      let i = null,
                        o = null;
                      if (!s) {
                        let t = [e.flags.ignoreCase];
                        rD(e, n$, {
                          getCurrentModI: () => t.at(-1),
                          popModI() {
                            t.pop();
                          },
                          pushModI(e) {
                            t.push(e);
                          },
                          setHasCasedChar() {
                            t.at(-1) ? (i = !0) : (o = !0);
                          },
                        });
                      }
                      let l = {
                          dotAll: e.flags.dotAll,
                          ignoreCase: !!((e.flags.ignoreCase || i) && !o),
                        },
                        c = e,
                        u = {
                          accuracy: r.accuracy,
                          appliedGlobalFlags: l,
                          captureMap: new Map(),
                          currentFlags: {
                            dotAll: e.flags.dotAll,
                            ignoreCase: e.flags.ignoreCase,
                          },
                          inCharClass: !1,
                          lastNode: c,
                          originMap: e._originMap,
                          recursionLimit: a,
                          useAppliedIgnoreCase: !!(!s && i && o),
                          useFlagMods: s,
                          useFlagV: n,
                          verbose: r.verbose,
                        };
                      function h(e) {
                        return (
                          (u.lastNode = c),
                          (c = e),
                          (function (e, t) {
                            if (null == e) throw Error(t ?? "Value expected");
                            return e;
                          })(nL[e.type], `Unexpected node type "${e.type}"`)(
                            e,
                            u,
                            h,
                          )
                        );
                      }
                      let p = {
                        pattern: e.body.map(h).join("|"),
                        flags: h(e.flags),
                        options: { ...e.options },
                      };
                      return (
                        n ||
                          (delete p.options.force.v,
                          (p.options.disable.v = !0),
                          (p.options.unicodeSetsPlugin = null)),
                        (p._captureTransfers = new Map()),
                        (p._hiddenCaptures = []),
                        u.captureMap.forEach((e, t) => {
                          (e.hidden && p._hiddenCaptures.push(t),
                            e.transferTo &&
                              nr(p._captureTransfers, e.transferTo, []).push(
                                t,
                              ));
                        }),
                        p
                      );
                    })(l, o),
                    u = (function (e, t) {
                      let r,
                        { hiddenCaptures: n, mode: s } = {
                          hiddenCaptures: [],
                          mode: "plugin",
                          ...t,
                        },
                        a = t?.captureTransfers ?? new Map();
                      if (!RegExp(rY, "su").test(e))
                        return {
                          pattern: e,
                          captureTransfers: a,
                          hiddenCaptures: n,
                        };
                      if (
                        "plugin" === s &&
                        rH(e, rZ`\(\?\(DEFINE\)`, rq.DEFAULT)
                      )
                        throw Error(
                          "DEFINE groups cannot be used with recursion",
                        );
                      let i = [],
                        o = rH(e, rZ`\\[1-9]`, rq.DEFAULT),
                        l = new Map(),
                        c = [],
                        u = !1,
                        h = 0,
                        p = 0;
                      for (r1.lastIndex = 0; (r = r1.exec(e));) {
                        let {
                          0: t,
                          groups: {
                            captureName: d,
                            rDepth: g,
                            gRNameOrNum: f,
                            gRDepth: m,
                          },
                        } = r;
                        if ("[" === t) h++;
                        else if (h) "]" === t && h--;
                        else if (g) {
                          if ((r3(g), u)) throw Error(r2);
                          if (o)
                            throw Error(
                              `${"external" === s ? "Backrefs" : "Numbered backrefs"} cannot be used with global recursion`,
                            );
                          let t = e.slice(0, r.index),
                            l = e.slice(r1.lastIndex);
                          if (rH(l, rY, rq.DEFAULT)) throw Error(r2);
                          let c = g - 1;
                          ((e = r5(t, l, c, !1, n, i, p)),
                            (a = r4(a, t, c, i.length, 0, p)));
                          break;
                        } else if (f) {
                          r3(m);
                          let h = !1;
                          for (let e of c)
                            if (e.name === f || e.num === +f) {
                              if (((h = !0), e.hasRecursedWithin))
                                throw Error(r2);
                              break;
                            }
                          if (!h)
                            throw Error(
                              rZ`Recursive \g cannot be used outside the referenced group "${"external" === s ? f : rZ`\g<${f}&R=${m}>`}"`,
                            );
                          let d = l.get(f),
                            g = (function (e, t) {
                              let r,
                                n = /\\?./gsu;
                              n.lastIndex = t;
                              let s = e.length,
                                a = 0,
                                i = 1;
                              for (; (r = n.exec(e));) {
                                let [e] = r;
                                if ("[" === e) a++;
                                else if (a) "]" === e && a--;
                                else if ("(" === e) i++;
                                else if (")" === e && !--i) {
                                  s = r.index;
                                  break;
                                }
                              }
                              return e.slice(t, s);
                            })(e, d);
                          if (o && rH(g, rZ`${rJ}|\((?!\?)`, rq.DEFAULT))
                            throw Error(
                              `${"external" === s ? "Backrefs" : "Numbered backrefs"} cannot be used with recursion of capturing groups`,
                            );
                          let y = e.slice(d, r.index),
                            b = g.slice(y.length + t.length),
                            _ = i.length,
                            k = m - 1,
                            w = r5(y, b, k, !0, n, i, p);
                          a = r4(a, y, k, i.length - _, _, p);
                          let C = e.slice(0, d),
                            S = e.slice(d + g.length);
                          ((e = `${C}${w}${S}`),
                            (r1.lastIndex +=
                              w.length - t.length - y.length - b.length),
                            c.forEach((e) => (e.hasRecursedWithin = !0)),
                            (u = !0));
                        } else if (d)
                          (p++,
                            l.set(String(p), r1.lastIndex),
                            l.set(d, r1.lastIndex),
                            c.push({ num: p, name: d }));
                        else if ("(" === t[0]) {
                          let e = "(" === t;
                          (e && (p++, l.set(String(p), r1.lastIndex)),
                            c.push(e ? { num: p } : {}));
                        } else ")" === t && c.pop();
                      }
                      return (
                        n.push(...i),
                        { pattern: e, captureTransfers: a, hiddenCaptures: n }
                      );
                    })(c.pattern, {
                      captureTransfers: c._captureTransfers,
                      hiddenCaptures: c._hiddenCaptures,
                      mode: "external",
                    }),
                    h = (function (e, t) {
                      let r,
                        n = t?.hiddenCaptures ?? [],
                        s = t?.captureTransfers ?? new Map();
                      if (!/\(\?>/.test(e))
                        return {
                          pattern: e,
                          captureTransfers: s,
                          hiddenCaptures: n,
                        };
                      let a = "(?:(?=(",
                        i = [0],
                        o = [],
                        l = 0,
                        c = 0,
                        u = 0 / 0;
                      do {
                        let t;
                        r = !1;
                        let h = 0,
                          p = 0,
                          d = !1;
                        for (
                          rV.lastIndex = Number.isNaN(u) ? 0 : u + a.length;
                          (t = rV.exec(e));
                        ) {
                          let {
                            0: g,
                            index: f,
                            groups: { capturingStart: m, noncapturingStart: y },
                          } = t;
                          if ("[" === g) h++;
                          else if (h) "]" === g && h--;
                          else if ("(?>" !== g || d) {
                            if (d && y) p++;
                            else if (m) d ? p++ : (l++, i.push(l + c));
                            else if (")" === g && d) {
                              if (!p) {
                                let t = l + ++c;
                                ((e = `${e.slice(0, u)}${a}${e.slice(u + 3, f)}))<$$${t}>)${e.slice(f + 1)}`),
                                  (r = !0),
                                  o.push(t));
                                for (let e = 0; e < n.length; e++)
                                  n[e] >= t && n[e]++;
                                if (s.size) {
                                  let e = new Map();
                                  (s.forEach((r, n) => {
                                    e.set(
                                      n >= t ? n + 1 : n,
                                      r.map((e) => (e >= t ? e + 1 : e)),
                                    );
                                  }),
                                    (s = e));
                                }
                                break;
                              }
                              p--;
                            }
                          } else ((u = f), (d = !0));
                        }
                      } while (r);
                      return (
                        n.push(...o),
                        {
                          pattern: (e = rz(
                            e,
                            String.raw`\\(?<backrefNum>[1-9]\d*)|<\$\$(?<wrappedBackrefNum>\d+)>`,
                            ({
                              0: e,
                              groups: { backrefNum: t, wrappedBackrefNum: r },
                            }) => {
                              if (t) {
                                let r = +t;
                                if (r > i.length - 1)
                                  throw Error(
                                    `Backref "${e}" greater than number of captures`,
                                  );
                                return `\\${i[r]}`;
                              }
                              return `\\${r}`;
                            },
                            rq.DEFAULT,
                          )),
                          captureTransfers: s,
                          hiddenCaptures: n,
                        }
                      );
                    })(
                      (function (e) {
                        let t;
                        if (!RegExp(`${rX}\\+`).test(e)) return { pattern: e };
                        let r = [],
                          n = null,
                          s = null,
                          a = "",
                          i = 0;
                        for (rQ.lastIndex = 0; (t = rQ.exec(e));) {
                          let {
                            0: c,
                            index: u,
                            groups: { qBase: h, qMod: p, invalidQ: d },
                          } = t;
                          if ("[" === c) (i || (s = u), i++);
                          else if ("]" === c) i ? i-- : (s = null);
                          else if (!i)
                            if ("+" === p && a && !a.startsWith("(")) {
                              if (d) throw Error(`Invalid quantifier "${c}"`);
                              let t = -1;
                              if (/^\{\d+\}$/.test(h)) {
                                var o, l;
                                ((o = e),
                                  (l = u + h.length),
                                  (e =
                                    o.slice(0, l) +
                                    "" +
                                    o.slice(l + p.length)));
                              } else {
                                if (")" === a || "]" === a) {
                                  let t = ")" === a ? n : s;
                                  if (null === t)
                                    throw Error(`Invalid unmatched "${a}"`);
                                  e = `${e.slice(0, t)}(?>${e.slice(t, u)}${h})${e.slice(u + c.length)}`;
                                } else
                                  e = `${e.slice(0, u - a.length)}(?>${a}${h})${e.slice(u + c.length)}`;
                                t += 4;
                              }
                              rQ.lastIndex += t;
                            } else
                              "(" === c[0]
                                ? r.push(u)
                                : ")" === c && (n = r.length ? r.pop() : null);
                          a = c;
                        }
                        return { pattern: e };
                      })(u.pattern).pattern,
                      {
                        captureTransfers: u.captureTransfers,
                        hiddenCaptures: u.hiddenCaptures,
                      },
                    ),
                    p = {
                      pattern: h.pattern,
                      flags: `${o.hasIndices ? "d" : ""}${o.global ? "g" : ""}${c.flags}${c.options.disable.v ? "u" : "v"}`,
                    };
                  if (o.avoidSubclass) {
                    if (1 / 0 !== o.lazyCompileLength)
                      throw Error("Lazy compilation requires subclass");
                  } else {
                    let e = h.hiddenCaptures.sort((e, t) => e - t),
                      t = Array.from(h.captureTransfers),
                      r = l._strategy,
                      n = p.pattern.length >= o.lazyCompileLength;
                    (e.length || t.length || r || n) &&
                      (p.options = {
                        ...(e.length && { hiddenCaptures: e }),
                        ...(t.length && { transfers: t }),
                        ...(r && { strategy: r }),
                        ...(n && { lazyCompile: n }),
                      });
                  }
                  return p;
                })(e, {
                  global: !0,
                  hasIndices: !0,
                  lazyCompileLength: 3e3,
                  rules: {
                    allowOrphanBackrefs: !0,
                    asciiWordBoundaries: !0,
                    captureGroup: !0,
                    recursionLimit: 5,
                    singleline: !0,
                  },
                  ...{ target: t.target },
                })).options
                  ? new nU(r.pattern, r.flags, r.options)
                  : new RegExp(r.pattern, r.flags);
              }),
              { createScanner: (e) => new t5(e, t), createString: t4 }
            );
          },
        ],
        228426,
      );
    },
  ],
  [
    [496481],
    (e) => {
      "use strict";
      e.s([
        "f",
        0,
        function (e, n) {
          let t = String(e);
          if ("string" != typeof n) throw TypeError("Expected character");
          let l = 0,
            a = t.indexOf(n);
          for (; -1 !== a;) (l++, (a = t.indexOf(n, a + n.length)));
          return l;
        },
      ]);
    },
  ],
  [
    [124963],
    (e) => {
      "use strict";
      let n = /[ \t\n\f\r]/g;
      function t(e) {
        return "" === e.replace(n, "");
      }
      e.s([
        "f",
        0,
        function (e) {
          return "object" == typeof e ? "text" === e.type && t(e.value) : t(e);
        },
      ]);
    },
  ],
  [
    [76696, 640553, 359091],
    (e) => {
      "use strict";
      e.s(
        [
          "x",
          0,
          function (e) {
            let n = [],
              t = String(e || ""),
              l = t.indexOf(","),
              a = 0,
              o = !1;
            for (; !o;) {
              -1 === l && ((l = t.length), (o = !0));
              let e = t.slice(a, l).trim();
              ((e || !o) && n.push(e), (a = l + 1), (l = t.indexOf(",", a)));
            }
            return n;
          },
          "b",
          0,
          function (e, n) {
            let t = n || {};
            return ("" === e[e.length - 1] ? [...e, ""] : e)
              .join(
                (t.padRight ? " " : "") + "," + (!1 === t.padLeft ? "" : " "),
              )
              .trim();
          },
        ],
        76696,
      );
      var n = e.i(402326),
        t = e.i(28619),
        l = e.i(864012);
      let a = /[A-Z]/g,
        o = /-[a-z]/g,
        i = /^data[-\w.:]+$/i;
      function r(e) {
        return "-" + e.toLowerCase();
      }
      function s(e) {
        return e.charAt(1).toUpperCase();
      }
      (e.s(
        [
          "f",
          0,
          function (e, u) {
            let c = (0, l.f)(u),
              d = u,
              m = t.f;
            if (c in e.normal) return e.property[e.normal[c]];
            if (c.length > 4 && "data" === c.slice(0, 4) && i.test(u)) {
              if ("-" === u.charAt(4)) {
                let e = u.slice(5).replace(o, s);
                d = "data" + e.charAt(0).toUpperCase() + e.slice(1);
              } else {
                let e = u.slice(4);
                if (!o.test(e)) {
                  let n = e.replace(a, r);
                  ("-" !== n.charAt(0) && (n = "-" + n), (u = "data" + n));
                }
              }
              m = n.f;
            }
            return new m(d, u);
          },
        ],
        640553,
      ),
        e.s(
          [
            "x",
            0,
            function (e) {
              let n = String(e || "").trim();
              return n ? n.split(/[ \t\n\r\f]+/g) : [];
            },
            "b",
            0,
            function (e) {
              return e.join(" ").trim();
            },
          ],
          359091,
        ));
    },
  ],
  [
    [157871, 864012, 28619, 402326],
    (e) => {
      "use strict";
      class n {
        constructor(e, n, t) {
          ((this.normal = n), (this.property = e), t && (this.space = t));
        }
      }
      function t(e, t) {
        let l = {},
          a = {};
        for (let n of e)
          (Object.assign(l, n.property), Object.assign(a, n.normal));
        return new n(l, a, t);
      }
      function l(e) {
        return e.toLowerCase();
      }
      ((n.prototype.normal = {}),
        (n.prototype.property = {}),
        (n.prototype.space = void 0),
        e.s(["f", 0, l], 864012));
      class a {
        constructor(e, n) {
          ((this.attribute = n), (this.property = e));
        }
      }
      ((a.prototype.attribute = ""),
        (a.prototype.booleanish = !1),
        (a.prototype.boolean = !1),
        (a.prototype.commaOrSpaceSeparated = !1),
        (a.prototype.commaSeparated = !1),
        (a.prototype.defined = !1),
        (a.prototype.mustUseProperty = !1),
        (a.prototype.number = !1),
        (a.prototype.overloadedBoolean = !1),
        (a.prototype.property = ""),
        (a.prototype.spaceSeparated = !1),
        (a.prototype.space = void 0),
        e.s(["f", 0, a], 28619));
      let o = 0,
        i = p(),
        r = p(),
        s = p(),
        u = p(),
        c = p(),
        d = p(),
        m = p();
      function p() {
        return 2 ** ++o;
      }
      e.s(
        [
          "boolean",
          0,
          i,
          "booleanish",
          0,
          r,
          "commaOrSpaceSeparated",
          0,
          m,
          "commaSeparated",
          0,
          d,
          "number",
          0,
          u,
          "overloadedBoolean",
          0,
          s,
          "spaceSeparated",
          0,
          c,
        ],
        400744,
      );
      var h = e.i(400744);
      let g = Object.keys(h);
      class f extends a {
        constructor(e, n, t, l) {
          var a, o, i, r, s;
          let u = -1;
          if (
            (super(e, n),
            (a = this),
            (o = l) && (a.space = o),
            "number" == typeof t)
          )
            for (; ++u < g.length;) {
              let e = g[u];
              ((i = this), (r = g[u]), (s = (t & h[e]) === h[e]) && (i[r] = s));
            }
        }
      }
      function b(e) {
        let t = {},
          a = {};
        for (let [n, o] of Object.entries(e.properties)) {
          let i = new f(n, e.transform(e.attributes || {}, n), o, e.space);
          (e.mustUseProperty &&
            e.mustUseProperty.includes(n) &&
            (i.mustUseProperty = !0),
            (t[n] = i),
            (a[l(n)] = n),
            (a[l(i.attribute)] = n));
        }
        return new n(t, a, e.space);
      }
      ((f.prototype.defined = !0), e.s(["f", 0, f], 402326));
      let y = b({
        properties: {
          ariaActiveDescendant: null,
          ariaAtomic: r,
          ariaAutoComplete: null,
          ariaBusy: r,
          ariaChecked: r,
          ariaColCount: u,
          ariaColIndex: u,
          ariaColSpan: u,
          ariaControls: c,
          ariaCurrent: null,
          ariaDescribedBy: c,
          ariaDetails: null,
          ariaDisabled: r,
          ariaDropEffect: c,
          ariaErrorMessage: null,
          ariaExpanded: r,
          ariaFlowTo: c,
          ariaGrabbed: r,
          ariaHasPopup: null,
          ariaHidden: r,
          ariaInvalid: null,
          ariaKeyShortcuts: null,
          ariaLabel: null,
          ariaLabelledBy: c,
          ariaLevel: u,
          ariaLive: null,
          ariaModal: r,
          ariaMultiLine: r,
          ariaMultiSelectable: r,
          ariaOrientation: null,
          ariaOwns: c,
          ariaPlaceholder: null,
          ariaPosInSet: u,
          ariaPressed: r,
          ariaReadOnly: r,
          ariaRelevant: null,
          ariaRequired: r,
          ariaRoleDescription: c,
          ariaRowCount: u,
          ariaRowIndex: u,
          ariaRowSpan: u,
          ariaSelected: r,
          ariaSetSize: u,
          ariaSort: null,
          ariaValueMax: u,
          ariaValueMin: u,
          ariaValueNow: u,
          ariaValueText: null,
          role: null,
        },
        transform: (e, n) =>
          "role" === n ? n : "aria-" + n.slice(4).toLowerCase(),
      });
      function v(e, n) {
        return n in e ? e[n] : n;
      }
      function _(e, n) {
        return v(e, n.toLowerCase());
      }
      let w = b({
          attributes: {
            acceptcharset: "accept-charset",
            classname: "class",
            htmlfor: "for",
            httpequiv: "http-equiv",
          },
          mustUseProperty: ["checked", "multiple", "muted", "selected"],
          properties: {
            abbr: null,
            accept: d,
            acceptCharset: c,
            accessKey: c,
            action: null,
            allow: null,
            allowFullScreen: i,
            allowPaymentRequest: i,
            allowUserMedia: i,
            alpha: i,
            alt: null,
            as: null,
            async: i,
            autoCapitalize: null,
            autoComplete: c,
            autoFocus: i,
            autoPlay: i,
            blocking: c,
            capture: null,
            charSet: null,
            checked: i,
            cite: null,
            className: c,
            closedBy: null,
            colorSpace: null,
            cols: u,
            colSpan: u,
            command: null,
            commandFor: null,
            content: null,
            contentEditable: r,
            controls: i,
            controlsList: c,
            coords: u | d,
            crossOrigin: null,
            data: null,
            dateTime: null,
            decoding: null,
            default: i,
            defer: i,
            dir: null,
            dirName: null,
            disabled: i,
            download: s,
            draggable: r,
            encType: null,
            enterKeyHint: null,
            fetchPriority: null,
            form: null,
            formAction: null,
            formEncType: null,
            formMethod: null,
            formNoValidate: i,
            formTarget: null,
            headers: c,
            height: u,
            hidden: s,
            high: u,
            href: null,
            hrefLang: null,
            htmlFor: c,
            httpEquiv: c,
            id: null,
            imageSizes: null,
            imageSrcSet: null,
            inert: i,
            inputMode: null,
            integrity: null,
            is: null,
            isMap: i,
            itemId: null,
            itemProp: c,
            itemRef: c,
            itemScope: i,
            itemType: c,
            kind: null,
            label: null,
            lang: null,
            language: null,
            list: null,
            loading: null,
            loop: i,
            low: u,
            manifest: null,
            max: null,
            maxLength: u,
            media: null,
            method: null,
            min: null,
            minLength: u,
            multiple: i,
            muted: i,
            name: null,
            nonce: null,
            noModule: i,
            noValidate: i,
            onAbort: null,
            onAfterPrint: null,
            onAuxClick: null,
            onBeforeMatch: null,
            onBeforePrint: null,
            onBeforeToggle: null,
            onBeforeUnload: null,
            onBlur: null,
            onCancel: null,
            onCanPlay: null,
            onCanPlayThrough: null,
            onChange: null,
            onClick: null,
            onClose: null,
            onContextLost: null,
            onContextMenu: null,
            onContextRestored: null,
            onCopy: null,
            onCueChange: null,
            onCut: null,
            onDblClick: null,
            onDrag: null,
            onDragEnd: null,
            onDragEnter: null,
            onDragExit: null,
            onDragLeave: null,
            onDragOver: null,
            onDragStart: null,
            onDrop: null,
            onDurationChange: null,
            onEmptied: null,
            onEnded: null,
            onError: null,
            onFocus: null,
            onFormData: null,
            onHashChange: null,
            onInput: null,
            onInvalid: null,
            onKeyDown: null,
            onKeyPress: null,
            onKeyUp: null,
            onLanguageChange: null,
            onLoad: null,
            onLoadedData: null,
            onLoadedMetadata: null,
            onLoadEnd: null,
            onLoadStart: null,
            onMessage: null,
            onMessageError: null,
            onMouseDown: null,
            onMouseEnter: null,
            onMouseLeave: null,
            onMouseMove: null,
            onMouseOut: null,
            onMouseOver: null,
            onMouseUp: null,
            onOffline: null,
            onOnline: null,
            onPageHide: null,
            onPageShow: null,
            onPaste: null,
            onPause: null,
            onPlay: null,
            onPlaying: null,
            onPopState: null,
            onProgress: null,
            onRateChange: null,
            onRejectionHandled: null,
            onReset: null,
            onResize: null,
            onScroll: null,
            onScrollEnd: null,
            onSecurityPolicyViolation: null,
            onSeeked: null,
            onSeeking: null,
            onSelect: null,
            onSlotChange: null,
            onStalled: null,
            onStorage: null,
            onSubmit: null,
            onSuspend: null,
            onTimeUpdate: null,
            onToggle: null,
            onUnhandledRejection: null,
            onUnload: null,
            onVolumeChange: null,
            onWaiting: null,
            onWheel: null,
            open: i,
            optimum: u,
            pattern: null,
            ping: c,
            placeholder: null,
            playsInline: i,
            popover: null,
            popoverTarget: null,
            popoverTargetAction: null,
            poster: null,
            preload: null,
            readOnly: i,
            referrerPolicy: null,
            rel: c,
            required: i,
            reversed: i,
            rows: u,
            rowSpan: u,
            sandbox: c,
            scope: null,
            scoped: i,
            seamless: i,
            selected: i,
            shadowRootClonable: i,
            shadowRootCustomElementRegistry: i,
            shadowRootDelegatesFocus: i,
            shadowRootMode: null,
            shadowRootSerializable: i,
            shape: null,
            size: u,
            sizes: null,
            slot: null,
            span: u,
            spellCheck: r,
            src: null,
            srcDoc: null,
            srcLang: null,
            srcSet: null,
            start: u,
            step: null,
            style: null,
            tabIndex: u,
            target: null,
            title: null,
            translate: null,
            type: null,
            typeMustMatch: i,
            useMap: null,
            value: r,
            width: u,
            wrap: null,
            writingSuggestions: null,
            align: null,
            aLink: null,
            archive: c,
            axis: null,
            background: null,
            bgColor: null,
            border: u,
            borderColor: null,
            bottomMargin: u,
            cellPadding: null,
            cellSpacing: null,
            char: null,
            charOff: null,
            classId: null,
            clear: null,
            code: null,
            codeBase: null,
            codeType: null,
            color: null,
            compact: i,
            declare: i,
            event: null,
            face: null,
            frame: null,
            frameBorder: null,
            hSpace: u,
            leftMargin: u,
            link: null,
            longDesc: null,
            lowSrc: null,
            marginHeight: u,
            marginWidth: u,
            noResize: i,
            noHref: i,
            noShade: i,
            noWrap: i,
            object: null,
            profile: null,
            prompt: null,
            rev: null,
            rightMargin: u,
            rules: null,
            scheme: null,
            scrolling: r,
            standby: null,
            summary: null,
            text: null,
            topMargin: u,
            valueType: null,
            version: null,
            vAlign: null,
            vLink: null,
            vSpace: u,
            allowTransparency: null,
            autoCorrect: null,
            autoSave: null,
            credentialless: i,
            disablePictureInPicture: i,
            disableRemotePlayback: i,
            exportParts: d,
            part: c,
            prefix: null,
            property: null,
            results: u,
            security: null,
            unselectable: null,
          },
          space: "html",
          transform: _,
        }),
        k = b({
          attributes: {
            accentHeight: "accent-height",
            alignmentBaseline: "alignment-baseline",
            arabicForm: "arabic-form",
            baselineShift: "baseline-shift",
            capHeight: "cap-height",
            className: "class",
            clipPath: "clip-path",
            clipRule: "clip-rule",
            colorInterpolation: "color-interpolation",
            colorInterpolationFilters: "color-interpolation-filters",
            colorProfile: "color-profile",
            colorRendering: "color-rendering",
            crossOrigin: "crossorigin",
            dataType: "datatype",
            dominantBaseline: "dominant-baseline",
            enableBackground: "enable-background",
            fillOpacity: "fill-opacity",
            fillRule: "fill-rule",
            floodColor: "flood-color",
            floodOpacity: "flood-opacity",
            fontFamily: "font-family",
            fontSize: "font-size",
            fontSizeAdjust: "font-size-adjust",
            fontStretch: "font-stretch",
            fontStyle: "font-style",
            fontVariant: "font-variant",
            fontWeight: "font-weight",
            glyphName: "glyph-name",
            glyphOrientationHorizontal: "glyph-orientation-horizontal",
            glyphOrientationVertical: "glyph-orientation-vertical",
            hrefLang: "hreflang",
            horizAdvX: "horiz-adv-x",
            horizOriginX: "horiz-origin-x",
            horizOriginY: "horiz-origin-y",
            imageRendering: "image-rendering",
            letterSpacing: "letter-spacing",
            lightingColor: "lighting-color",
            markerEnd: "marker-end",
            markerMid: "marker-mid",
            markerStart: "marker-start",
            maskType: "mask-type",
            navDown: "nav-down",
            navDownLeft: "nav-down-left",
            navDownRight: "nav-down-right",
            navLeft: "nav-left",
            navNext: "nav-next",
            navPrev: "nav-prev",
            navRight: "nav-right",
            navUp: "nav-up",
            navUpLeft: "nav-up-left",
            navUpRight: "nav-up-right",
            onAbort: "onabort",
            onActivate: "onactivate",
            onAfterPrint: "onafterprint",
            onBeforePrint: "onbeforeprint",
            onBegin: "onbegin",
            onCancel: "oncancel",
            onCanPlay: "oncanplay",
            onCanPlayThrough: "oncanplaythrough",
            onChange: "onchange",
            onClick: "onclick",
            onClose: "onclose",
            onCopy: "oncopy",
            onCueChange: "oncuechange",
            onCut: "oncut",
            onDblClick: "ondblclick",
            onDrag: "ondrag",
            onDragEnd: "ondragend",
            onDragEnter: "ondragenter",
            onDragExit: "ondragexit",
            onDragLeave: "ondragleave",
            onDragOver: "ondragover",
            onDragStart: "ondragstart",
            onDrop: "ondrop",
            onDurationChange: "ondurationchange",
            onEmptied: "onemptied",
            onEnd: "onend",
            onEnded: "onended",
            onError: "onerror",
            onFocus: "onfocus",
            onFocusIn: "onfocusin",
            onFocusOut: "onfocusout",
            onHashChange: "onhashchange",
            onInput: "oninput",
            onInvalid: "oninvalid",
            onKeyDown: "onkeydown",
            onKeyPress: "onkeypress",
            onKeyUp: "onkeyup",
            onLoad: "onload",
            onLoadedData: "onloadeddata",
            onLoadedMetadata: "onloadedmetadata",
            onLoadStart: "onloadstart",
            onMessage: "onmessage",
            onMouseDown: "onmousedown",
            onMouseEnter: "onmouseenter",
            onMouseLeave: "onmouseleave",
            onMouseMove: "onmousemove",
            onMouseOut: "onmouseout",
            onMouseOver: "onmouseover",
            onMouseUp: "onmouseup",
            onMouseWheel: "onmousewheel",
            onOffline: "onoffline",
            onOnline: "ononline",
            onPageHide: "onpagehide",
            onPageShow: "onpageshow",
            onPaste: "onpaste",
            onPause: "onpause",
            onPlay: "onplay",
            onPlaying: "onplaying",
            onPopState: "onpopstate",
            onProgress: "onprogress",
            onRateChange: "onratechange",
            onRepeat: "onrepeat",
            onReset: "onreset",
            onResize: "onresize",
            onScroll: "onscroll",
            onSeeked: "onseeked",
            onSeeking: "onseeking",
            onSelect: "onselect",
            onShow: "onshow",
            onStalled: "onstalled",
            onStorage: "onstorage",
            onSubmit: "onsubmit",
            onSuspend: "onsuspend",
            onTimeUpdate: "ontimeupdate",
            onToggle: "ontoggle",
            onUnload: "onunload",
            onVolumeChange: "onvolumechange",
            onWaiting: "onwaiting",
            onZoom: "onzoom",
            overlinePosition: "overline-position",
            overlineThickness: "overline-thickness",
            paintOrder: "paint-order",
            panose1: "panose-1",
            pointerEvents: "pointer-events",
            referrerPolicy: "referrerpolicy",
            renderingIntent: "rendering-intent",
            shapeRendering: "shape-rendering",
            stopColor: "stop-color",
            stopOpacity: "stop-opacity",
            strikethroughPosition: "strikethrough-position",
            strikethroughThickness: "strikethrough-thickness",
            strokeDashArray: "stroke-dasharray",
            strokeDashOffset: "stroke-dashoffset",
            strokeLineCap: "stroke-linecap",
            strokeLineJoin: "stroke-linejoin",
            strokeMiterLimit: "stroke-miterlimit",
            strokeOpacity: "stroke-opacity",
            strokeWidth: "stroke-width",
            tabIndex: "tabindex",
            textAnchor: "text-anchor",
            textDecoration: "text-decoration",
            textRendering: "text-rendering",
            transformOrigin: "transform-origin",
            typeOf: "typeof",
            underlinePosition: "underline-position",
            underlineThickness: "underline-thickness",
            unicodeBidi: "unicode-bidi",
            unicodeRange: "unicode-range",
            unitsPerEm: "units-per-em",
            vAlphabetic: "v-alphabetic",
            vHanging: "v-hanging",
            vIdeographic: "v-ideographic",
            vMathematical: "v-mathematical",
            vectorEffect: "vector-effect",
            vertAdvY: "vert-adv-y",
            vertOriginX: "vert-origin-x",
            vertOriginY: "vert-origin-y",
            wordSpacing: "word-spacing",
            writingMode: "writing-mode",
            xHeight: "x-height",
            playbackOrder: "playbackorder",
            timelineBegin: "timelinebegin",
          },
          properties: {
            about: m,
            accentHeight: u,
            accumulate: null,
            additive: null,
            alignmentBaseline: null,
            alphabetic: u,
            amplitude: u,
            arabicForm: null,
            ascent: u,
            attributeName: null,
            attributeType: null,
            azimuth: u,
            bandwidth: null,
            baselineShift: null,
            baseFrequency: null,
            baseProfile: null,
            bbox: null,
            begin: null,
            bias: u,
            by: null,
            calcMode: null,
            capHeight: u,
            className: c,
            clip: null,
            clipPath: null,
            clipPathUnits: null,
            clipRule: null,
            color: null,
            colorInterpolation: null,
            colorInterpolationFilters: null,
            colorProfile: null,
            colorRendering: null,
            content: null,
            contentScriptType: null,
            contentStyleType: null,
            crossOrigin: null,
            cursor: null,
            cx: null,
            cy: null,
            d: null,
            dataType: null,
            defaultAction: null,
            descent: u,
            diffuseConstant: u,
            direction: null,
            display: null,
            dur: null,
            divisor: u,
            dominantBaseline: null,
            download: i,
            dx: null,
            dy: null,
            edgeMode: null,
            editable: null,
            elevation: u,
            enableBackground: null,
            end: null,
            event: null,
            exponent: u,
            externalResourcesRequired: null,
            fill: null,
            fillOpacity: u,
            fillRule: null,
            filter: null,
            filterRes: null,
            filterUnits: null,
            floodColor: null,
            floodOpacity: null,
            focusable: null,
            focusHighlight: null,
            fontFamily: null,
            fontSize: null,
            fontSizeAdjust: null,
            fontStretch: null,
            fontStyle: null,
            fontVariant: null,
            fontWeight: null,
            format: null,
            fr: null,
            from: null,
            fx: null,
            fy: null,
            g1: d,
            g2: d,
            glyphName: d,
            glyphOrientationHorizontal: null,
            glyphOrientationVertical: null,
            glyphRef: null,
            gradientTransform: null,
            gradientUnits: null,
            handler: null,
            hanging: u,
            hatchContentUnits: null,
            hatchUnits: null,
            height: null,
            href: null,
            hrefLang: null,
            horizAdvX: u,
            horizOriginX: u,
            horizOriginY: u,
            id: null,
            ideographic: u,
            imageRendering: null,
            initialVisibility: null,
            in: null,
            in2: null,
            intercept: u,
            k: u,
            k1: u,
            k2: u,
            k3: u,
            k4: u,
            kernelMatrix: m,
            kernelUnitLength: null,
            keyPoints: null,
            keySplines: null,
            keyTimes: null,
            kerning: null,
            lang: null,
            lengthAdjust: null,
            letterSpacing: null,
            lightingColor: null,
            limitingConeAngle: u,
            local: null,
            markerEnd: null,
            markerMid: null,
            markerStart: null,
            markerHeight: null,
            markerUnits: null,
            markerWidth: null,
            mask: null,
            maskContentUnits: null,
            maskType: null,
            maskUnits: null,
            mathematical: null,
            max: null,
            media: null,
            mediaCharacterEncoding: null,
            mediaContentEncodings: null,
            mediaSize: u,
            mediaTime: null,
            method: null,
            min: null,
            mode: null,
            name: null,
            navDown: null,
            navDownLeft: null,
            navDownRight: null,
            navLeft: null,
            navNext: null,
            navPrev: null,
            navRight: null,
            navUp: null,
            navUpLeft: null,
            navUpRight: null,
            numOctaves: null,
            observer: null,
            offset: null,
            onAbort: null,
            onActivate: null,
            onAfterPrint: null,
            onBeforePrint: null,
            onBegin: null,
            onCancel: null,
            onCanPlay: null,
            onCanPlayThrough: null,
            onChange: null,
            onClick: null,
            onClose: null,
            onCopy: null,
            onCueChange: null,
            onCut: null,
            onDblClick: null,
            onDrag: null,
            onDragEnd: null,
            onDragEnter: null,
            onDragExit: null,
            onDragLeave: null,
            onDragOver: null,
            onDragStart: null,
            onDrop: null,
            onDurationChange: null,
            onEmptied: null,
            onEnd: null,
            onEnded: null,
            onError: null,
            onFocus: null,
            onFocusIn: null,
            onFocusOut: null,
            onHashChange: null,
            onInput: null,
            onInvalid: null,
            onKeyDown: null,
            onKeyPress: null,
            onKeyUp: null,
            onLoad: null,
            onLoadedData: null,
            onLoadedMetadata: null,
            onLoadStart: null,
            onMessage: null,
            onMouseDown: null,
            onMouseEnter: null,
            onMouseLeave: null,
            onMouseMove: null,
            onMouseOut: null,
            onMouseOver: null,
            onMouseUp: null,
            onMouseWheel: null,
            onOffline: null,
            onOnline: null,
            onPageHide: null,
            onPageShow: null,
            onPaste: null,
            onPause: null,
            onPlay: null,
            onPlaying: null,
            onPopState: null,
            onProgress: null,
            onRateChange: null,
            onRepeat: null,
            onReset: null,
            onResize: null,
            onScroll: null,
            onSeeked: null,
            onSeeking: null,
            onSelect: null,
            onShow: null,
            onStalled: null,
            onStorage: null,
            onSubmit: null,
            onSuspend: null,
            onTimeUpdate: null,
            onToggle: null,
            onUnload: null,
            onVolumeChange: null,
            onWaiting: null,
            onZoom: null,
            opacity: null,
            operator: null,
            order: null,
            orient: null,
            orientation: null,
            origin: null,
            overflow: null,
            overlay: null,
            overlinePosition: u,
            overlineThickness: u,
            paintOrder: null,
            panose1: null,
            path: null,
            pathLength: u,
            patternContentUnits: null,
            patternTransform: null,
            patternUnits: null,
            phase: null,
            ping: c,
            pitch: null,
            playbackOrder: null,
            pointerEvents: null,
            points: null,
            pointsAtX: u,
            pointsAtY: u,
            pointsAtZ: u,
            preserveAlpha: null,
            preserveAspectRatio: null,
            primitiveUnits: null,
            propagate: null,
            property: m,
            r: null,
            radius: null,
            referrerPolicy: null,
            refX: null,
            refY: null,
            rel: m,
            rev: m,
            renderingIntent: null,
            repeatCount: null,
            repeatDur: null,
            requiredExtensions: m,
            requiredFeatures: m,
            requiredFonts: m,
            requiredFormats: m,
            resource: null,
            restart: null,
            result: null,
            rotate: null,
            rx: null,
            ry: null,
            scale: null,
            seed: null,
            shapeRendering: null,
            side: null,
            slope: null,
            snapshotTime: null,
            specularConstant: u,
            specularExponent: u,
            spreadMethod: null,
            spacing: null,
            startOffset: null,
            stdDeviation: null,
            stemh: null,
            stemv: null,
            stitchTiles: null,
            stopColor: null,
            stopOpacity: null,
            strikethroughPosition: u,
            strikethroughThickness: u,
            string: null,
            stroke: null,
            strokeDashArray: m,
            strokeDashOffset: null,
            strokeLineCap: null,
            strokeLineJoin: null,
            strokeMiterLimit: u,
            strokeOpacity: u,
            strokeWidth: null,
            style: null,
            surfaceScale: u,
            syncBehavior: null,
            syncBehaviorDefault: null,
            syncMaster: null,
            syncTolerance: null,
            syncToleranceDefault: null,
            systemLanguage: m,
            tabIndex: u,
            tableValues: null,
            target: null,
            targetX: u,
            targetY: u,
            textAnchor: null,
            textDecoration: null,
            textRendering: null,
            textLength: null,
            timelineBegin: null,
            title: null,
            transformBehavior: null,
            type: null,
            typeOf: m,
            to: null,
            transform: null,
            transformOrigin: null,
            u1: null,
            u2: null,
            underlinePosition: u,
            underlineThickness: u,
            unicode: null,
            unicodeBidi: null,
            unicodeRange: null,
            unitsPerEm: u,
            values: null,
            vAlphabetic: u,
            vMathematical: u,
            vectorEffect: null,
            vHanging: u,
            vIdeographic: u,
            version: null,
            vertAdvY: u,
            vertOriginX: u,
            vertOriginY: u,
            viewBox: null,
            viewTarget: null,
            visibility: null,
            width: null,
            widths: null,
            wordSpacing: null,
            writingMode: null,
            x: null,
            x1: null,
            x2: null,
            xChannelSelector: null,
            xHeight: u,
            y: null,
            y1: null,
            y2: null,
            yChannelSelector: null,
            z: null,
            zoomAndPan: null,
          },
          space: "svg",
          transform: v,
        }),
        x = b({
          properties: {
            xLinkActuate: null,
            xLinkArcRole: null,
            xLinkHref: null,
            xLinkRole: null,
            xLinkShow: null,
            xLinkTitle: null,
            xLinkType: null,
          },
          space: "xlink",
          transform: (e, n) => "xlink:" + n.slice(5).toLowerCase(),
        }),
        C = b({
          attributes: { xmlnsxlink: "xmlns:xlink" },
          properties: { xmlnsXLink: null, xmlns: null },
          space: "xmlns",
          transform: _,
        }),
        $ = b({
          properties: { xmlBase: null, xmlLang: null, xmlSpace: null },
          space: "xml",
          transform: (e, n) => "xml:" + n.slice(3).toLowerCase(),
        }),
        S = t([y, w, x, C, $], "html"),
        P = t([y, k, x, C, $], "svg");
      e.s(["c", 0, S, "V", 0, P], 157871);
    },
  ],
  [
    [122952],
    (e) => {
      "use strict";
      let n = Object.freeze(
        JSON.parse(
          '{"displayName":"JavaScript","name":"javascript","patterns":[{"include":"#directives"},{"include":"#statements"},{"include":"#shebang"}],"repository":{"access-modifier":{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(abstract|declare|override|public|protected|private|readonly|static)(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","name":"storage.modifier.js"},"after-operator-block-as-object-literal":{"begin":"(?<!\\\\+\\\\+|--)(?<=[!(+,:=>?\\\\[]|^await|[^$._[:alnum:]]await|^return|[^$._[:alnum:]]return|^yield|[^$._[:alnum:]]yield|^throw|[^$._[:alnum:]]throw|^in|[^$._[:alnum:]]in|^of|[^$._[:alnum:]]of|^typeof|[^$._[:alnum:]]typeof|&&|\\\\|\\\\||\\\\*)\\\\s*(\\\\{)","beginCaptures":{"1":{"name":"punctuation.definition.block.js"}},"end":"}","endCaptures":{"0":{"name":"punctuation.definition.block.js"}},"name":"meta.objectliteral.js","patterns":[{"include":"#object-member"}]},"array-binding-pattern":{"begin":"(?:(\\\\.\\\\.\\\\.)\\\\s*)?(\\\\[)","beginCaptures":{"1":{"name":"keyword.operator.rest.js"},"2":{"name":"punctuation.definition.binding-pattern.array.js"}},"end":"]","endCaptures":{"0":{"name":"punctuation.definition.binding-pattern.array.js"}},"patterns":[{"include":"#binding-element"},{"include":"#punctuation-comma"}]},"array-binding-pattern-const":{"begin":"(?:(\\\\.\\\\.\\\\.)\\\\s*)?(\\\\[)","beginCaptures":{"1":{"name":"keyword.operator.rest.js"},"2":{"name":"punctuation.definition.binding-pattern.array.js"}},"end":"]","endCaptures":{"0":{"name":"punctuation.definition.binding-pattern.array.js"}},"patterns":[{"include":"#binding-element-const"},{"include":"#punctuation-comma"}]},"array-literal":{"begin":"\\\\s*(\\\\[)","beginCaptures":{"1":{"name":"meta.brace.square.js"}},"end":"]","endCaptures":{"0":{"name":"meta.brace.square.js"}},"name":"meta.array.literal.js","patterns":[{"include":"#expression"},{"include":"#punctuation-comma"}]},"arrow-function":{"patterns":[{"captures":{"1":{"name":"storage.modifier.async.js"},"2":{"name":"variable.parameter.js"}},"match":"(?:(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))\\\\b(async)\\\\s+)?([$_[:alpha:]][$_[:alnum:]]*)\\\\s*(?==>)","name":"meta.arrow.js"},{"begin":"(?:(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))\\\\b(async))?((?<![]!)}])\\\\s*(?=((<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*)?\\\\(\\\\s*(/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*)*((\\\\)\\\\s*:)|((\\\\.\\\\.\\\\.\\\\s*)?[$_[:alpha:]][$_[:alnum:]]*\\\\s*:)))|(<\\\\s*[$_[:alpha:]][$_[:alnum:]]*\\\\s+extends\\\\s*[^=>])|((<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*)?\\\\(\\\\s*(/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*)*(([$_[:alpha:]]|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])|(\\\\.\\\\.\\\\.\\\\s*[$_[:alpha:]]))([^\\"\'()`]|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`))*)?\\\\)(\\\\s*:\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+)?\\\\s*=>)))","beginCaptures":{"1":{"name":"storage.modifier.async.js"}},"end":"(?==>|\\\\{|^(\\\\s*(export|function|class|interface|let|var|\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b|\\\\bawait\\\\s+\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b\\\\b|const|import|enum|namespace|module|type|abstract|declare)\\\\s+))","name":"meta.arrow.js","patterns":[{"include":"#comment"},{"include":"#type-parameters"},{"include":"#function-parameters"},{"include":"#arrow-return-type"},{"include":"#possibly-arrow-return-type"}]},{"begin":"=>","beginCaptures":{"0":{"name":"storage.type.function.arrow.js"}},"end":"((?<=[}\\\\S])(?<!=>)|((?!\\\\{)(?=\\\\S)))(?!/[*/])","name":"meta.arrow.js","patterns":[{"include":"#single-line-comment-consuming-line-ending"},{"include":"#decl-block"},{"include":"#expression"}]}]},"arrow-return-type":{"begin":"(?<=\\\\))\\\\s*(:)","beginCaptures":{"1":{"name":"keyword.operator.type.annotation.js"}},"end":"(?==>|\\\\{|^(\\\\s*(export|function|class|interface|let|var|\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b|\\\\bawait\\\\s+\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b\\\\b|const|import|enum|namespace|module|type|abstract|declare)\\\\s+))","name":"meta.return.type.arrow.js","patterns":[{"include":"#arrow-return-type-body"}]},"arrow-return-type-body":{"patterns":[{"begin":"(?<=:)(?=\\\\s*\\\\{)","end":"(?<=})","patterns":[{"include":"#type-object"}]},{"include":"#type-predicate-operator"},{"include":"#type"}]},"async-modifier":{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(async)(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","name":"storage.modifier.async.js"},"binding-element":{"patterns":[{"include":"#comment"},{"include":"#string"},{"include":"#numeric-literal"},{"include":"#regex"},{"include":"#object-binding-pattern"},{"include":"#array-binding-pattern"},{"include":"#destructuring-variable-rest"},{"include":"#variable-initializer"}]},"binding-element-const":{"patterns":[{"include":"#comment"},{"include":"#string"},{"include":"#numeric-literal"},{"include":"#regex"},{"include":"#object-binding-pattern-const"},{"include":"#array-binding-pattern-const"},{"include":"#destructuring-variable-rest-const"},{"include":"#variable-initializer"}]},"boolean-literal":{"patterns":[{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))true(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","name":"constant.language.boolean.true.js"},{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))false(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","name":"constant.language.boolean.false.js"}]},"brackets":{"patterns":[{"begin":"\\\\{","end":"}|(?=\\\\*/)","patterns":[{"include":"#brackets"}]},{"begin":"\\\\[","end":"]|(?=\\\\*/)","patterns":[{"include":"#brackets"}]}]},"cast":{"patterns":[{"include":"#jsx"}]},"class-declaration":{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:\\\\b(export)\\\\s+)?(?:\\\\b(declare)\\\\s+)?\\\\b(?:(abstract)\\\\s+)?\\\\b(class)\\\\b(?=\\\\s+|/[*/])","beginCaptures":{"1":{"name":"keyword.control.export.js"},"2":{"name":"storage.modifier.js"},"3":{"name":"storage.modifier.js"},"4":{"name":"storage.type.class.js"}},"end":"(?<=})","name":"meta.class.js","patterns":[{"include":"#class-declaration-or-expression-patterns"}]},"class-declaration-or-expression-patterns":{"patterns":[{"include":"#comment"},{"include":"#class-or-interface-heritage"},{"captures":{"0":{"name":"entity.name.type.class.js"}},"match":"[$_[:alpha:]][$_[:alnum:]]*"},{"include":"#type-parameters"},{"include":"#class-or-interface-body"}]},"class-expression":{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:(abstract)\\\\s+)?(class)\\\\b(?=\\\\s+|[<{]|/[*/])","beginCaptures":{"1":{"name":"storage.modifier.js"},"2":{"name":"storage.type.class.js"}},"end":"(?<=})","name":"meta.class.js","patterns":[{"include":"#class-declaration-or-expression-patterns"}]},"class-or-interface-body":{"begin":"\\\\{","beginCaptures":{"0":{"name":"punctuation.definition.block.js"}},"end":"}","endCaptures":{"0":{"name":"punctuation.definition.block.js"}},"patterns":[{"include":"#comment"},{"include":"#decorator"},{"begin":"(?<=:)\\\\s*","end":"(?=[-\\\\])+,:;}\\\\s]|^\\\\s*$|^\\\\s*(?:abstract|async|\\\\bawait\\\\s+\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b\\\\b|break|case|catch|class|const|continue|declare|do|else|enum|export|finally|function|for|goto|if|import|interface|let|module|namespace|switch|return|throw|try|type|\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b|var|while)\\\\b)","patterns":[{"include":"#expression"}]},{"include":"#method-declaration"},{"include":"#indexer-declaration"},{"include":"#field-declaration"},{"include":"#string"},{"include":"#type-annotation"},{"include":"#variable-initializer"},{"include":"#access-modifier"},{"include":"#property-accessor"},{"include":"#async-modifier"},{"include":"#after-operator-block-as-object-literal"},{"include":"#decl-block"},{"include":"#expression"},{"include":"#punctuation-comma"},{"include":"#punctuation-semicolon"}]},"class-or-interface-heritage":{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))\\\\b(extends|implements)\\\\b(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","beginCaptures":{"1":{"name":"storage.modifier.js"}},"end":"(?=\\\\{)","patterns":[{"include":"#comment"},{"include":"#class-or-interface-heritage"},{"include":"#type-parameters"},{"include":"#expressionWithoutIdentifiers"},{"captures":{"1":{"name":"entity.name.type.module.js"},"2":{"name":"punctuation.accessor.js"},"3":{"name":"punctuation.accessor.optional.js"}},"match":"([$_[:alpha:]][$_[:alnum:]]*)\\\\s*(?:(\\\\.)|(\\\\?\\\\.(?!\\\\s*\\\\d)))(?=\\\\s*[$_[:alpha:]][$_[:alnum:]]*(\\\\s*\\\\??\\\\.\\\\s*[$_[:alpha:]][$_[:alnum:]]*)*\\\\s*)"},{"captures":{"1":{"name":"entity.other.inherited-class.js"}},"match":"([$_[:alpha:]][$_[:alnum:]]*)"},{"include":"#expressionPunctuations"}]},"comment":{"patterns":[{"begin":"/\\\\*\\\\*(?!/)","beginCaptures":{"0":{"name":"punctuation.definition.comment.js"}},"end":"\\\\*/","endCaptures":{"0":{"name":"punctuation.definition.comment.js"}},"name":"comment.block.documentation.js","patterns":[{"include":"#docblock"}]},{"begin":"(/\\\\*)(?:\\\\s*((@)internal)(?=\\\\s|(\\\\*/)))?","beginCaptures":{"1":{"name":"punctuation.definition.comment.js"},"2":{"name":"storage.type.internaldeclaration.js"},"3":{"name":"punctuation.decorator.internaldeclaration.js"}},"end":"\\\\*/","endCaptures":{"0":{"name":"punctuation.definition.comment.js"}},"name":"comment.block.js"},{"begin":"(^[\\\\t ]+)?((//)(?:\\\\s*((@)internal)(?=\\\\s|$))?)","beginCaptures":{"1":{"name":"punctuation.whitespace.comment.leading.js"},"2":{"name":"comment.line.double-slash.js"},"3":{"name":"punctuation.definition.comment.js"},"4":{"name":"storage.type.internaldeclaration.js"},"5":{"name":"punctuation.decorator.internaldeclaration.js"}},"contentName":"comment.line.double-slash.js","end":"(?=$)"}]},"control-statement":{"patterns":[{"include":"#switch-statement"},{"include":"#for-loop"},{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(catch|finally|throw|try)(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","name":"keyword.control.trycatch.js"},{"captures":{"1":{"name":"keyword.control.loop.js"},"2":{"name":"entity.name.label.js"}},"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(break|continue|goto)\\\\s+([$_[:alpha:]][$_[:alnum:]]*)(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))"},{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(break|continue|do|goto|while)(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","name":"keyword.control.loop.js"},{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(return)(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","beginCaptures":{"0":{"name":"keyword.control.flow.js"}},"end":"(?=[;}]|$|;|^\\\\s*$|^\\\\s*(?:abstract|async|\\\\bawait\\\\s+\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b\\\\b|break|case|catch|class|const|continue|declare|do|else|enum|export|finally|function|for|goto|if|import|interface|let|module|namespace|switch|return|throw|try|type|\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b|var|while)\\\\b)","patterns":[{"include":"#expression"}]},{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(case|default|switch)(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","name":"keyword.control.switch.js"},{"include":"#if-statement"},{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(else|if)(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","name":"keyword.control.conditional.js"},{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(with)(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","name":"keyword.control.with.js"},{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(package)(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","name":"keyword.control.js"},{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(debugger)(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","name":"keyword.other.debugger.js"}]},"decl-block":{"begin":"\\\\{","beginCaptures":{"0":{"name":"punctuation.definition.block.js"}},"end":"}","endCaptures":{"0":{"name":"punctuation.definition.block.js"}},"name":"meta.block.js","patterns":[{"include":"#statements"}]},"declaration":{"patterns":[{"include":"#decorator"},{"include":"#var-expr"},{"include":"#function-declaration"},{"include":"#class-declaration"},{"include":"#interface-declaration"},{"include":"#enum-declaration"},{"include":"#namespace-declaration"},{"include":"#type-alias-declaration"},{"include":"#import-equals-declaration"},{"include":"#import-declaration"},{"include":"#export-declaration"},{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(declare|export)(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","name":"storage.modifier.js"}]},"decorator":{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))@","beginCaptures":{"0":{"name":"punctuation.decorator.js"}},"end":"(?=\\\\s)","name":"meta.decorator.js","patterns":[{"include":"#expression"}]},"destructuring-const":{"patterns":[{"begin":"(?<![:=]|^of|[^$._[:alnum:]]of|^in|[^$._[:alnum:]]in)\\\\s*(?=\\\\{)","end":"(?=$|^|[,;=}]|((?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(of|in)\\\\s+))","name":"meta.object-binding-pattern-variable.js","patterns":[{"include":"#object-binding-pattern-const"},{"include":"#type-annotation"},{"include":"#comment"}]},{"begin":"(?<![:=]|^of|[^$._[:alnum:]]of|^in|[^$._[:alnum:]]in)\\\\s*(?=\\\\[)","end":"(?=$|^|[,;=}]|((?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(of|in)\\\\s+))","name":"meta.array-binding-pattern-variable.js","patterns":[{"include":"#array-binding-pattern-const"},{"include":"#type-annotation"},{"include":"#comment"}]}]},"destructuring-parameter":{"patterns":[{"begin":"(?<![:=])\\\\s*(?:(\\\\.\\\\.\\\\.)\\\\s*)?(\\\\{)","beginCaptures":{"1":{"name":"keyword.operator.rest.js"},"2":{"name":"punctuation.definition.binding-pattern.object.js"}},"end":"}","endCaptures":{"0":{"name":"punctuation.definition.binding-pattern.object.js"}},"name":"meta.parameter.object-binding-pattern.js","patterns":[{"include":"#parameter-object-binding-element"}]},{"begin":"(?<![:=])\\\\s*(?:(\\\\.\\\\.\\\\.)\\\\s*)?(\\\\[)","beginCaptures":{"1":{"name":"keyword.operator.rest.js"},"2":{"name":"punctuation.definition.binding-pattern.array.js"}},"end":"]","endCaptures":{"0":{"name":"punctuation.definition.binding-pattern.array.js"}},"name":"meta.paramter.array-binding-pattern.js","patterns":[{"include":"#parameter-binding-element"},{"include":"#punctuation-comma"}]}]},"destructuring-parameter-rest":{"captures":{"1":{"name":"keyword.operator.rest.js"},"2":{"name":"variable.parameter.js"}},"match":"(?:(\\\\.\\\\.\\\\.)\\\\s*)?([$_[:alpha:]][$_[:alnum:]]*)"},"destructuring-variable":{"patterns":[{"begin":"(?<![:=]|^of|[^$._[:alnum:]]of|^in|[^$._[:alnum:]]in)\\\\s*(?=\\\\{)","end":"(?=$|^|[,;=}]|((?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(of|in)\\\\s+))","name":"meta.object-binding-pattern-variable.js","patterns":[{"include":"#object-binding-pattern"},{"include":"#type-annotation"},{"include":"#comment"}]},{"begin":"(?<![:=]|^of|[^$._[:alnum:]]of|^in|[^$._[:alnum:]]in)\\\\s*(?=\\\\[)","end":"(?=$|^|[,;=}]|((?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(of|in)\\\\s+))","name":"meta.array-binding-pattern-variable.js","patterns":[{"include":"#array-binding-pattern"},{"include":"#type-annotation"},{"include":"#comment"}]}]},"destructuring-variable-rest":{"captures":{"1":{"name":"keyword.operator.rest.js"},"2":{"name":"meta.definition.variable.js variable.other.readwrite.js"}},"match":"(?:(\\\\.\\\\.\\\\.)\\\\s*)?([$_[:alpha:]][$_[:alnum:]]*)"},"destructuring-variable-rest-const":{"captures":{"1":{"name":"keyword.operator.rest.js"},"2":{"name":"meta.definition.variable.js variable.other.constant.js"}},"match":"(?:(\\\\.\\\\.\\\\.)\\\\s*)?([$_[:alpha:]][$_[:alnum:]]*)"},"directives":{"begin":"^(///)\\\\s*(?=<(reference|amd-dependency|amd-module)(\\\\s+(path|types|no-default-lib|lib|name|resolution-mode)\\\\s*=\\\\s*((\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`)))+\\\\s*/>\\\\s*$)","beginCaptures":{"1":{"name":"punctuation.definition.comment.js"}},"end":"(?=$)","name":"comment.line.triple-slash.directive.js","patterns":[{"begin":"(<)(reference|amd-dependency|amd-module)","beginCaptures":{"1":{"name":"punctuation.definition.tag.directive.js"},"2":{"name":"entity.name.tag.directive.js"}},"end":"/>","endCaptures":{"0":{"name":"punctuation.definition.tag.directive.js"}},"name":"meta.tag.js","patterns":[{"match":"path|types|no-default-lib|lib|name|resolution-mode","name":"entity.other.attribute-name.directive.js"},{"match":"=","name":"keyword.operator.assignment.js"},{"include":"#string"}]}]},"docblock":{"patterns":[{"captures":{"1":{"name":"storage.type.class.jsdoc"},"2":{"name":"punctuation.definition.block.tag.jsdoc"},"3":{"name":"constant.language.access-type.jsdoc"}},"match":"((@)a(?:ccess|pi))\\\\s+(p(?:rivate|rotected|ublic))\\\\b"},{"captures":{"1":{"name":"storage.type.class.jsdoc"},"2":{"name":"punctuation.definition.block.tag.jsdoc"},"3":{"name":"entity.name.type.instance.jsdoc"},"4":{"name":"punctuation.definition.bracket.angle.begin.jsdoc"},"5":{"name":"constant.other.email.link.underline.jsdoc"},"6":{"name":"punctuation.definition.bracket.angle.end.jsdoc"}},"match":"((@)author)\\\\s+([^*/<>@\\\\s](?:[^*/<>@]|\\\\*[^/])*)(?:\\\\s*(<)([^>\\\\s]+)(>))?"},{"captures":{"1":{"name":"storage.type.class.jsdoc"},"2":{"name":"punctuation.definition.block.tag.jsdoc"},"3":{"name":"entity.name.type.instance.jsdoc"},"4":{"name":"keyword.operator.control.jsdoc"},"5":{"name":"entity.name.type.instance.jsdoc"}},"match":"((@)borrows)\\\\s+((?:[^*/@\\\\s]|\\\\*[^/])+)\\\\s+(as)\\\\s+((?:[^*/@\\\\s]|\\\\*[^/])+)"},{"begin":"((@)example)\\\\s+","beginCaptures":{"1":{"name":"storage.type.class.jsdoc"},"2":{"name":"punctuation.definition.block.tag.jsdoc"}},"end":"(?=@|\\\\*/)","name":"meta.example.jsdoc","patterns":[{"match":"^\\\\s\\\\*\\\\s+"},{"begin":"\\\\G(<)caption(>)","beginCaptures":{"0":{"name":"entity.name.tag.inline.jsdoc"},"1":{"name":"punctuation.definition.bracket.angle.begin.jsdoc"},"2":{"name":"punctuation.definition.bracket.angle.end.jsdoc"}},"contentName":"constant.other.description.jsdoc","end":"(</)caption(>)|(?=\\\\*/)","endCaptures":{"0":{"name":"entity.name.tag.inline.jsdoc"},"1":{"name":"punctuation.definition.bracket.angle.begin.jsdoc"},"2":{"name":"punctuation.definition.bracket.angle.end.jsdoc"}}},{"captures":{"0":{"name":"source.embedded.js"}},"match":"[^*@\\\\s](?:[^*]|\\\\*[^/])*"}]},{"captures":{"1":{"name":"storage.type.class.jsdoc"},"2":{"name":"punctuation.definition.block.tag.jsdoc"},"3":{"name":"constant.language.symbol-type.jsdoc"}},"match":"((@)kind)\\\\s+(class|constant|event|external|file|function|member|mixin|module|namespace|typedef)\\\\b"},{"captures":{"1":{"name":"storage.type.class.jsdoc"},"2":{"name":"punctuation.definition.block.tag.jsdoc"},"3":{"name":"variable.other.link.underline.jsdoc"},"4":{"name":"entity.name.type.instance.jsdoc"}},"match":"((@)see)\\\\s+(?:((?=https?://)(?:[^*\\\\s]|\\\\*[^/])+)|((?!https?://|(?:\\\\[[^]\\\\[]*])?\\\\{@(?:link|linkcode|linkplain|tutorial)\\\\b)(?:[^*/@\\\\s]|\\\\*[^/])+))"},{"captures":{"1":{"name":"storage.type.class.jsdoc"},"2":{"name":"punctuation.definition.block.tag.jsdoc"},"3":{"name":"variable.other.jsdoc"}},"match":"((@)template)\\\\s+([$A-Z_a-z][]$.\\\\[\\\\w]*(?:\\\\s*,\\\\s*[$A-Z_a-z][]$.\\\\[\\\\w]*)*)"},{"begin":"((@)template)\\\\s+(?=\\\\{)","beginCaptures":{"1":{"name":"storage.type.class.jsdoc"},"2":{"name":"punctuation.definition.block.tag.jsdoc"}},"end":"(?=\\\\s|\\\\*/|[^]$A-\\\\[_a-{}])","patterns":[{"include":"#jsdoctype"},{"match":"([$A-Z_a-z][]$.\\\\[\\\\w]*)","name":"variable.other.jsdoc"}]},{"captures":{"1":{"name":"storage.type.class.jsdoc"},"2":{"name":"punctuation.definition.block.tag.jsdoc"},"3":{"name":"variable.other.jsdoc"}},"match":"((@)(?:arg|argument|const|constant|member|namespace|param|var))\\\\s+([$A-Z_a-z][]$.\\\\[\\\\w]*)"},{"begin":"((@)typedef)\\\\s+(?=\\\\{)","beginCaptures":{"1":{"name":"storage.type.class.jsdoc"},"2":{"name":"punctuation.definition.block.tag.jsdoc"}},"end":"(?=\\\\s|\\\\*/|[^]$A-\\\\[_a-{}])","patterns":[{"include":"#jsdoctype"},{"match":"(?:[^*/@\\\\s]|\\\\*[^/])+","name":"entity.name.type.instance.jsdoc"}]},{"begin":"((@)(?:arg|argument|const|constant|member|namespace|param|prop|property|var))\\\\s+(?=\\\\{)","beginCaptures":{"1":{"name":"storage.type.class.jsdoc"},"2":{"name":"punctuation.definition.block.tag.jsdoc"}},"end":"(?=\\\\s|\\\\*/|[^]$A-\\\\[_a-{}])","patterns":[{"include":"#jsdoctype"},{"match":"([$A-Z_a-z][]$.\\\\[\\\\w]*)","name":"variable.other.jsdoc"},{"captures":{"1":{"name":"punctuation.definition.optional-value.begin.bracket.square.jsdoc"},"2":{"name":"keyword.operator.assignment.jsdoc"},"3":{"name":"source.embedded.js"},"4":{"name":"punctuation.definition.optional-value.end.bracket.square.jsdoc"},"5":{"name":"invalid.illegal.syntax.jsdoc"}},"match":"(\\\\[)\\\\s*[$\\\\w]+(?:(?:\\\\[])?\\\\.[$\\\\w]+)*(?:\\\\s*(=)\\\\s*((?>\\"(?:\\\\*(?!/)|\\\\\\\\(?!\\")|[^*\\\\\\\\])*?\\"|\'(?:\\\\*(?!/)|\\\\\\\\(?!\')|[^*\\\\\\\\])*?\'|\\\\[(?:\\\\*(?!/)|[^*])*?]|(?:\\\\*(?!/)|\\\\s(?!\\\\s*])|\\\\[.*?(?:]|(?=\\\\*/))|[^]*\\\\[\\\\s])*)*))?\\\\s*(?:(])((?:[^*\\\\s]|\\\\*[^/\\\\s])+)?|(?=\\\\*/))","name":"variable.other.jsdoc"}]},{"begin":"((@)(?:define|enum|exception|export|extends|lends|implements|modifies|namespace|private|protected|returns?|satisfies|suppress|this|throws|type|yields?))\\\\s+(?=\\\\{)","beginCaptures":{"1":{"name":"storage.type.class.jsdoc"},"2":{"name":"punctuation.definition.block.tag.jsdoc"}},"end":"(?=\\\\s|\\\\*/|[^]$A-\\\\[_a-{}])","patterns":[{"include":"#jsdoctype"}]},{"captures":{"1":{"name":"storage.type.class.jsdoc"},"2":{"name":"punctuation.definition.block.tag.jsdoc"},"3":{"name":"entity.name.type.instance.jsdoc"}},"match":"((@)(?:alias|augments|callback|constructs|emits|event|fires|exports?|extends|external|function|func|host|lends|listens|interface|memberof!?|method|module|mixes|mixin|name|requires|see|this|typedef|uses))\\\\s+((?:[^*@{}\\\\s]|\\\\*[^/])+)"},{"begin":"((@)(?:default(?:value)?|license|version))\\\\s+(([\\"\']))","beginCaptures":{"1":{"name":"storage.type.class.jsdoc"},"2":{"name":"punctuation.definition.block.tag.jsdoc"},"3":{"name":"variable.other.jsdoc"},"4":{"name":"punctuation.definition.string.begin.jsdoc"}},"contentName":"variable.other.jsdoc","end":"(\\\\3)|(?=$|\\\\*/)","endCaptures":{"0":{"name":"variable.other.jsdoc"},"1":{"name":"punctuation.definition.string.end.jsdoc"}}},{"captures":{"1":{"name":"storage.type.class.jsdoc"},"2":{"name":"punctuation.definition.block.tag.jsdoc"},"3":{"name":"variable.other.jsdoc"}},"match":"((@)(?:default(?:value)?|license|tutorial|variation|version))\\\\s+([^*\\\\s]+)"},{"captures":{"1":{"name":"punctuation.definition.block.tag.jsdoc"}},"match":"(@)(?:abstract|access|alias|api|arg|argument|async|attribute|augments|author|beta|borrows|bubbles|callback|chainable|class|classdesc|code|config|const|constant|constructor|constructs|copyright|default|defaultvalue|define|deprecated|desc|description|dict|emits|enum|event|example|exception|exports?|extends|extension(?:_?for)?|external|externs|file|fileoverview|final|fires|for|func|function|generator|global|hideconstructor|host|ignore|implements|implicitCast|inherit[Dd]oc|inner|instance|interface|internal|kind|lends|license|listens|main|member|memberof!?|method|mixes|mixins?|modifies|module|name|namespace|noalias|nocollapse|nocompile|nosideeffects|override|overview|package|param|polymer(?:Behavior)?|preserve|private|prop|property|protected|public|read[Oo]nly|record|require[ds]|returns?|see|since|static|struct|submodule|summary|suppress|template|this|throws|todo|tutorial|type|typedef|unrestricted|uses|var|variation|version|virtual|writeOnce|yields?)\\\\b","name":"storage.type.class.jsdoc"},{"include":"#inline-tags"},{"captures":{"1":{"name":"storage.type.class.jsdoc"},"2":{"name":"punctuation.definition.block.tag.jsdoc"}},"match":"((@)[$_[:alpha:]][$_[:alnum:]]*)(?=\\\\s+)"}]},"enum-declaration":{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:\\\\b(export)\\\\s+)?(?:\\\\b(declare)\\\\s+)?(?:\\\\b(const)\\\\s+)?\\\\b(enum)\\\\s+([$_[:alpha:]][$_[:alnum:]]*)","beginCaptures":{"1":{"name":"keyword.control.export.js"},"2":{"name":"storage.modifier.js"},"3":{"name":"storage.modifier.js"},"4":{"name":"storage.type.enum.js"},"5":{"name":"entity.name.type.enum.js"}},"end":"(?<=})","name":"meta.enum.declaration.js","patterns":[{"include":"#comment"},{"begin":"\\\\{","beginCaptures":{"0":{"name":"punctuation.definition.block.js"}},"end":"}","endCaptures":{"0":{"name":"punctuation.definition.block.js"}},"patterns":[{"include":"#comment"},{"begin":"([$_[:alpha:]][$_[:alnum:]]*)","beginCaptures":{"0":{"name":"variable.other.enummember.js"}},"end":"(?=[,}]|$)","patterns":[{"include":"#comment"},{"include":"#variable-initializer"}]},{"begin":"(?=((\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`)|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])+])))","end":"(?=[,}]|$)","patterns":[{"include":"#string"},{"include":"#array-literal"},{"include":"#comment"},{"include":"#variable-initializer"}]},{"include":"#punctuation-comma"}]}]},"export-declaration":{"patterns":[{"captures":{"1":{"name":"keyword.control.export.js"},"2":{"name":"keyword.control.as.js"},"3":{"name":"storage.type.namespace.js"},"4":{"name":"entity.name.type.module.js"}},"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(export)\\\\s+(as)\\\\s+(namespace)\\\\s+([$_[:alpha:]][$_[:alnum:]]*)"},{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(export)(?:\\\\s+(type))?(?:\\\\s*(=)|\\\\s+(default)(?=\\\\s+))","beginCaptures":{"1":{"name":"keyword.control.export.js"},"2":{"name":"keyword.control.type.js"},"3":{"name":"keyword.operator.assignment.js"},"4":{"name":"keyword.control.default.js"}},"end":"(?=$|;|^\\\\s*$|^\\\\s*(?:abstract|async|\\\\bawait\\\\s+\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b\\\\b|break|case|catch|class|const|continue|declare|do|else|enum|export|finally|function|for|goto|if|import|interface|let|module|namespace|switch|return|throw|try|type|\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b|var|while)\\\\b)","name":"meta.export.default.js","patterns":[{"include":"#interface-declaration"},{"include":"#expression"}]},{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(export)(?:\\\\s+(type))?\\\\b(?!(\\\\$)|(\\\\s*:))((?=\\\\s*[*{])|((?=\\\\s*[$_[:alpha:]][$_[:alnum:]]*([,\\\\s]))(?!\\\\s*(?:abstract|async|\\\\bawait\\\\s+\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b\\\\b|break|case|catch|class|const|continue|declare|do|else|enum|export|finally|function|for|goto|if|import|interface|let|module|namespace|switch|return|throw|try|type|\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b|var|while)\\\\b)))","beginCaptures":{"1":{"name":"keyword.control.export.js"},"2":{"name":"keyword.control.type.js"}},"end":"(?=$|;|^\\\\s*$|^\\\\s*(?:abstract|async|\\\\bawait\\\\s+\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b\\\\b|break|case|catch|class|const|continue|declare|do|else|enum|export|finally|function|for|goto|if|import|interface|let|module|namespace|switch|return|throw|try|type|\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b|var|while)\\\\b)","name":"meta.export.js","patterns":[{"include":"#import-export-declaration"}]}]},"expression":{"patterns":[{"include":"#expressionWithoutIdentifiers"},{"include":"#identifiers"},{"include":"#expressionPunctuations"}]},"expression-inside-possibly-arrow-parens":{"patterns":[{"include":"#expressionWithoutIdentifiers"},{"include":"#comment"},{"include":"#string"},{"include":"#decorator"},{"include":"#destructuring-parameter"},{"captures":{"1":{"name":"storage.modifier.js"}},"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(override|public|protected|private|readonly)\\\\s+(?=(override|public|protected|private|readonly)\\\\s+)"},{"captures":{"1":{"name":"storage.modifier.js"},"2":{"name":"keyword.operator.rest.js"},"3":{"name":"entity.name.function.js variable.language.this.js"},"4":{"name":"entity.name.function.js"},"5":{"name":"keyword.operator.optional.js"}},"match":"(?:(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(override|public|private|protected|readonly)\\\\s+)?(?:(\\\\.\\\\.\\\\.)\\\\s*)?(?<![:=])(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:(this)|([$_[:alpha:]][$_[:alnum:]]*))(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))\\\\s*(\\\\??)(?=\\\\s*(=\\\\s*(((async\\\\s+)?((function\\\\s*[(*<])|(function\\\\s+)|([$_[:alpha:]][$_[:alnum:]]*\\\\s*=>)))|((async\\\\s*)?(((<\\\\s*)$|(\\\\(\\\\s*((([\\\\[{]\\\\s*)?)$|((\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})\\\\s*((:\\\\s*\\\\{?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*)))|((\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])\\\\s*((:\\\\s*\\\\[?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*))))))|((<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*)?\\\\(\\\\s*(/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*)*((\\\\)\\\\s*:)|((\\\\.\\\\.\\\\.\\\\s*)?[$_[:alpha:]][$_[:alnum:]]*\\\\s*:)))|(<\\\\s*[$_[:alpha:]][$_[:alnum:]]*\\\\s+extends\\\\s*[^=>])|((<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*)?\\\\(\\\\s*(/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*)*(([$_[:alpha:]]|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])|(\\\\.\\\\.\\\\.\\\\s*[$_[:alpha:]]))([^\\"\'()`]|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`))*)?\\\\)(\\\\s*:\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+)?\\\\s*=>)))))|(:\\\\s*((<)|(\\\\(\\\\s*((\\\\))|(\\\\.\\\\.\\\\.)|([$_[:alnum:]]+\\\\s*(([,:=?])|(\\\\)\\\\s*=>)))))))|(:\\\\s*(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))Function(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.)))|(:\\\\s*((<\\\\s*)$|(\\\\(\\\\s*((([\\\\[{]\\\\s*)?)$|((\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})\\\\s*((:\\\\s*\\\\{?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*)))|((\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])\\\\s*((:\\\\s*\\\\[?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*)))))))|(:\\\\s*(=>|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(<[^<>]*>)|[^(),<=>])+=\\\\s*(((async\\\\s+)?((function\\\\s*[(*<])|(function\\\\s+)|([$_[:alpha:]][$_[:alnum:]]*\\\\s*=>)))|((async\\\\s*)?(((<\\\\s*)$|(\\\\(\\\\s*((([\\\\[{]\\\\s*)?)$|((\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})\\\\s*((:\\\\s*\\\\{?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*)))|((\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])\\\\s*((:\\\\s*\\\\[?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*))))))|((<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*)?\\\\(\\\\s*(/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*)*((\\\\)\\\\s*:)|((\\\\.\\\\.\\\\.\\\\s*)?[$_[:alpha:]][$_[:alnum:]]*\\\\s*:)))|(<\\\\s*[$_[:alpha:]][$_[:alnum:]]*\\\\s+extends\\\\s*[^=>])|((<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*)?\\\\(\\\\s*(/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*)*(([$_[:alpha:]]|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])|(\\\\.\\\\.\\\\.\\\\s*[$_[:alpha:]]))([^\\"\'()`]|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`))*)?\\\\)(\\\\s*:\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+)?\\\\s*=>))))))"},{"captures":{"1":{"name":"storage.modifier.js"},"2":{"name":"keyword.operator.rest.js"},"3":{"name":"variable.parameter.js variable.language.this.js"},"4":{"name":"variable.parameter.js"},"5":{"name":"keyword.operator.optional.js"}},"match":"(?:(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(override|public|private|protected|readonly)\\\\s+)?(?:(\\\\.\\\\.\\\\.)\\\\s*)?(?<![:=])(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:(this)|([$_[:alpha:]][$_[:alnum:]]*))(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))\\\\s*(\\\\??)(?=\\\\s*[,:]|$)"},{"include":"#type-annotation"},{"include":"#variable-initializer"},{"match":",","name":"punctuation.separator.parameter.js"},{"include":"#identifiers"},{"include":"#expressionPunctuations"}]},"expression-operators":{"patterns":[{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(await)(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","name":"keyword.control.flow.js"},{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(yield)(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))(?=\\\\s*/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*\\\\*)","beginCaptures":{"1":{"name":"keyword.control.flow.js"}},"end":"\\\\*","endCaptures":{"0":{"name":"keyword.generator.asterisk.js"}},"patterns":[{"include":"#comment"}]},{"captures":{"1":{"name":"keyword.control.flow.js"},"2":{"name":"keyword.generator.asterisk.js"}},"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(yield)(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))(?:\\\\s*(\\\\*))?"},{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))delete(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","name":"keyword.operator.expression.delete.js"},{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))in(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))(?!\\\\()","name":"keyword.operator.expression.in.js"},{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))of(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))(?!\\\\()","name":"keyword.operator.expression.of.js"},{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))instanceof(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","name":"keyword.operator.expression.instanceof.js"},{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))new(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","name":"keyword.operator.new.js"},{"include":"#typeof-operator"},{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))void(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","name":"keyword.operator.expression.void.js"},{"captures":{"1":{"name":"keyword.control.as.js"},"2":{"name":"storage.modifier.js"}},"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(as)\\\\s+(const)(?=\\\\s*($|[]),:;}]))"},{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:(as)|(satisfies))\\\\s+","beginCaptures":{"1":{"name":"keyword.control.as.js"},"2":{"name":"keyword.control.satisfies.js"}},"end":"(?=^|[-\\\\])+,:;>?}]|\\\\|\\\\||&&|!==|$|((?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(as|satisfies)\\\\s+)|(\\\\s+<))","patterns":[{"include":"#type"}]},{"match":"\\\\.\\\\.\\\\.","name":"keyword.operator.spread.js"},{"match":"(?:\\\\*|(?<!\\\\()/|[-%+])=","name":"keyword.operator.assignment.compound.js"},{"match":"(?:[\\\\&^]|<<|>>>??|\\\\|)=","name":"keyword.operator.assignment.compound.bitwise.js"},{"match":"<<|>>>?","name":"keyword.operator.bitwise.shift.js"},{"match":"[!=]==?","name":"keyword.operator.comparison.js"},{"match":"<=|>=|<>|[<>]","name":"keyword.operator.relational.js"},{"captures":{"1":{"name":"keyword.operator.logical.js"},"2":{"name":"keyword.operator.assignment.compound.js"},"3":{"name":"keyword.operator.arithmetic.js"}},"match":"(?<=[$_[:alnum:]])(!)\\\\s*(?:(/=)|(/)(?![*/]))"},{"match":"!|&&|\\\\|\\\\||\\\\?\\\\?","name":"keyword.operator.logical.js"},{"match":"[\\\\&^|~]","name":"keyword.operator.bitwise.js"},{"match":"=","name":"keyword.operator.assignment.js"},{"match":"--","name":"keyword.operator.decrement.js"},{"match":"\\\\+\\\\+","name":"keyword.operator.increment.js"},{"match":"[-%*+/]","name":"keyword.operator.arithmetic.js"},{"begin":"(?<=[]$)_[:alnum:]])\\\\s*(?=(/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*)+(?:(/=)|(/)(?![*/])))","end":"(/=)|(/)(?!\\\\*([^*]|(\\\\*[^/]))*\\\\*/)","endCaptures":{"1":{"name":"keyword.operator.assignment.compound.js"},"2":{"name":"keyword.operator.arithmetic.js"}},"patterns":[{"include":"#comment"}]},{"captures":{"1":{"name":"keyword.operator.assignment.compound.js"},"2":{"name":"keyword.operator.arithmetic.js"}},"match":"(?<=[]$)_[:alnum:]])\\\\s*(?:(/=)|(/)(?![*/]))"}]},"expressionPunctuations":{"patterns":[{"include":"#punctuation-comma"},{"include":"#punctuation-accessor"}]},"expressionWithoutIdentifiers":{"patterns":[{"include":"#jsx"},{"include":"#string"},{"include":"#regex"},{"include":"#comment"},{"include":"#function-expression"},{"include":"#class-expression"},{"include":"#arrow-function"},{"include":"#paren-expression-possibly-arrow"},{"include":"#cast"},{"include":"#ternary-expression"},{"include":"#new-expr"},{"include":"#instanceof-expr"},{"include":"#object-literal"},{"include":"#expression-operators"},{"include":"#function-call"},{"include":"#literal"},{"include":"#support-objects"},{"include":"#paren-expression"}]},"field-declaration":{"begin":"(?<!\\\\()(?:(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(readonly)\\\\s+)?(?=\\\\s*(\\\\b((?<!\\\\$)0[Xx]\\\\h[_\\\\h]*(n)?\\\\b(?!\\\\$))|\\\\b((?<!\\\\$)0[Bb][01][01_]*(n)?\\\\b(?!\\\\$))|\\\\b((?<!\\\\$)0[Oo]?[0-7][0-7_]*(n)?\\\\b(?!\\\\$))|((?<!\\\\$)(?:\\\\b[0-9][0-9_]*(\\\\.)[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\B(\\\\.)[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)(n)?\\\\B|\\\\B(\\\\.)[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(n)?\\\\b(?!\\\\.))(?!\\\\$))|(#?[$_[:alpha:]][$_[:alnum:]]*)|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`)|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])+]))\\\\s*(?:(?:(\\\\?)|(!))\\\\s*)?([,:;=}]|$))","beginCaptures":{"1":{"name":"storage.modifier.js"}},"end":"(?=[,;}]|$|^((?!\\\\s*(\\\\b((?<!\\\\$)0[Xx]\\\\h[_\\\\h]*(n)?\\\\b(?!\\\\$))|\\\\b((?<!\\\\$)0[Bb][01][01_]*(n)?\\\\b(?!\\\\$))|\\\\b((?<!\\\\$)0[Oo]?[0-7][0-7_]*(n)?\\\\b(?!\\\\$))|((?<!\\\\$)(?:\\\\b[0-9][0-9_]*(\\\\.)[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\B(\\\\.)[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)(n)?\\\\B|\\\\B(\\\\.)[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(n)?\\\\b(?!\\\\.))(?!\\\\$))|(#?[$_[:alpha:]][$_[:alnum:]]*)|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`)|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])+]))\\\\s*(?:(?:(\\\\?)|(!))\\\\s*)?([,:;=]|$))))|(?<=})","name":"meta.field.declaration.js","patterns":[{"include":"#variable-initializer"},{"include":"#type-annotation"},{"include":"#string"},{"include":"#array-literal"},{"include":"#numeric-literal"},{"include":"#comment"},{"captures":{"1":{"name":"meta.definition.property.js entity.name.function.js"},"2":{"name":"keyword.operator.optional.js"},"3":{"name":"keyword.operator.definiteassignment.js"}},"match":"(#?[$_[:alpha:]][$_[:alnum:]]*)(?:(\\\\?)|(!))?(?=\\\\s*\\\\s*(=\\\\s*(((async\\\\s+)?((function\\\\s*[(*<])|(function\\\\s+)|([$_[:alpha:]][$_[:alnum:]]*\\\\s*=>)))|((async\\\\s*)?(((<\\\\s*)$|(\\\\(\\\\s*((([\\\\[{]\\\\s*)?)$|((\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})\\\\s*((:\\\\s*\\\\{?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*)))|((\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])\\\\s*((:\\\\s*\\\\[?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*))))))|((<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*)?\\\\(\\\\s*(/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*)*((\\\\)\\\\s*:)|((\\\\.\\\\.\\\\.\\\\s*)?[$_[:alpha:]][$_[:alnum:]]*\\\\s*:)))|(<\\\\s*[$_[:alpha:]][$_[:alnum:]]*\\\\s+extends\\\\s*[^=>])|((<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*)?\\\\(\\\\s*(/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*)*(([$_[:alpha:]]|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])|(\\\\.\\\\.\\\\.\\\\s*[$_[:alpha:]]))([^\\"\'()`]|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`))*)?\\\\)(\\\\s*:\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+)?\\\\s*=>)))))|(:\\\\s*((<)|(\\\\(\\\\s*((\\\\))|(\\\\.\\\\.\\\\.)|([$_[:alnum:]]+\\\\s*(([,:=?])|(\\\\)\\\\s*=>)))))))|(:\\\\s*(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))Function(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.)))|(:\\\\s*((<\\\\s*)$|(\\\\(\\\\s*((([\\\\[{]\\\\s*)?)$|((\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})\\\\s*((:\\\\s*\\\\{?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*)))|((\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])\\\\s*((:\\\\s*\\\\[?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*)))))))|(:\\\\s*(=>|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(<[^<>]*>)|[^(),<=>])+=\\\\s*(((async\\\\s+)?((function\\\\s*[(*<])|(function\\\\s+)|([$_[:alpha:]][$_[:alnum:]]*\\\\s*=>)))|((async\\\\s*)?(((<\\\\s*)$|(\\\\(\\\\s*((([\\\\[{]\\\\s*)?)$|((\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})\\\\s*((:\\\\s*\\\\{?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*)))|((\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])\\\\s*((:\\\\s*\\\\[?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*))))))|((<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*)?\\\\(\\\\s*(/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*)*((\\\\)\\\\s*:)|((\\\\.\\\\.\\\\.\\\\s*)?[$_[:alpha:]][$_[:alnum:]]*\\\\s*:)))|(<\\\\s*[$_[:alpha:]][$_[:alnum:]]*\\\\s+extends\\\\s*[^=>])|((<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*)?\\\\(\\\\s*(/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*)*(([$_[:alpha:]]|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])|(\\\\.\\\\.\\\\.\\\\s*[$_[:alpha:]]))([^\\"\'()`]|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`))*)?\\\\)(\\\\s*:\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+)?\\\\s*=>))))))"},{"match":"#?[$_[:alpha:]][$_[:alnum:]]*","name":"meta.definition.property.js variable.object.property.js"},{"match":"\\\\?","name":"keyword.operator.optional.js"},{"match":"!","name":"keyword.operator.definiteassignment.js"}]},"for-loop":{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))for(?=((\\\\s+|(\\\\s*/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*))await)?\\\\s*(/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*)?(\\\\())","beginCaptures":{"0":{"name":"keyword.control.loop.js"}},"end":"(?<=\\\\))","patterns":[{"include":"#comment"},{"match":"await","name":"keyword.control.loop.js"},{"begin":"\\\\(","beginCaptures":{"0":{"name":"meta.brace.round.js"}},"end":"\\\\)","endCaptures":{"0":{"name":"meta.brace.round.js"}},"patterns":[{"include":"#var-expr"},{"include":"#expression"},{"include":"#punctuation-semicolon"}]}]},"function-body":{"patterns":[{"include":"#comment"},{"include":"#type-parameters"},{"include":"#function-parameters"},{"include":"#return-type"},{"include":"#type-function-return-type"},{"include":"#decl-block"},{"match":"\\\\*","name":"keyword.generator.asterisk.js"}]},"function-call":{"patterns":[{"begin":"(?=(((([$_[:alpha:]][$_[:alnum:]]*)(\\\\s*\\\\??\\\\.\\\\s*(#?[$_[:alpha:]][$_[:alnum:]]*))*)|(\\\\??\\\\.\\\\s*#?[$_[:alpha:]][$_[:alnum:]]*))|(?<=\\\\)))\\\\s*(?:(\\\\?\\\\.\\\\s*)|(!))?((<\\\\s*(((keyof|infer|typeof|readonly)\\\\s+)|(([$_[:alpha:]][$_[:alnum:]]*|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`))(?=\\\\s*([,.<>\\\\[]|=>|&(?!&)|\\\\|(?!\\\\|)))))([^(<>]|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(?<==)>|<\\\\s*(((keyof|infer|typeof|readonly)\\\\s+)|(([$_[:alpha:]][$_[:alnum:]]*|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`))(?=\\\\s*([,.<>\\\\[]|=>|&(?!&)|\\\\|(?!\\\\|)))))(([^(<>]|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(?<==)>|<\\\\s*(((keyof|infer|typeof|readonly)\\\\s+)|(([$_[:alpha:]][$_[:alnum:]]*|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`))(?=\\\\s*([,.<>\\\\[]|=>|&(?!&)|\\\\|(?!\\\\|)))))([^(<>]|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(?<==)>)*(?<!=)>))*(?<!=)>)*(?<!=)>\\\\s*)?\\\\())","end":"(?<=\\\\))(?!(((([$_[:alpha:]][$_[:alnum:]]*)(\\\\s*\\\\??\\\\.\\\\s*(#?[$_[:alpha:]][$_[:alnum:]]*))*)|(\\\\??\\\\.\\\\s*#?[$_[:alpha:]][$_[:alnum:]]*))|(?<=\\\\)))\\\\s*(?:(\\\\?\\\\.\\\\s*)|(!))?((<\\\\s*(((keyof|infer|typeof|readonly)\\\\s+)|(([$_[:alpha:]][$_[:alnum:]]*|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`))(?=\\\\s*([,.<>\\\\[]|=>|&(?!&)|\\\\|(?!\\\\|)))))([^(<>]|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(?<==)>|<\\\\s*(((keyof|infer|typeof|readonly)\\\\s+)|(([$_[:alpha:]][$_[:alnum:]]*|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`))(?=\\\\s*([,.<>\\\\[]|=>|&(?!&)|\\\\|(?!\\\\|)))))(([^(<>]|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(?<==)>|<\\\\s*(((keyof|infer|typeof|readonly)\\\\s+)|(([$_[:alpha:]][$_[:alnum:]]*|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`))(?=\\\\s*([,.<>\\\\[]|=>|&(?!&)|\\\\|(?!\\\\|)))))([^(<>]|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(?<==)>)*(?<!=)>))*(?<!=)>)*(?<!=)>\\\\s*)?\\\\())","patterns":[{"begin":"(?=(([$_[:alpha:]][$_[:alnum:]]*)(\\\\s*\\\\??\\\\.\\\\s*(#?[$_[:alpha:]][$_[:alnum:]]*))*)|(\\\\??\\\\.\\\\s*#?[$_[:alpha:]][$_[:alnum:]]*))","end":"(?=\\\\s*(?:(\\\\?\\\\.\\\\s*)|(!))?((<\\\\s*(((keyof|infer|typeof|readonly)\\\\s+)|(([$_[:alpha:]][$_[:alnum:]]*|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`))(?=\\\\s*([,.<>\\\\[]|=>|&(?!&)|\\\\|(?!\\\\|)))))([^(<>]|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(?<==)>|<\\\\s*(((keyof|infer|typeof|readonly)\\\\s+)|(([$_[:alpha:]][$_[:alnum:]]*|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`))(?=\\\\s*([,.<>\\\\[]|=>|&(?!&)|\\\\|(?!\\\\|)))))(([^(<>]|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(?<==)>|<\\\\s*(((keyof|infer|typeof|readonly)\\\\s+)|(([$_[:alpha:]][$_[:alnum:]]*|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`))(?=\\\\s*([,.<>\\\\[]|=>|&(?!&)|\\\\|(?!\\\\|)))))([^(<>]|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(?<==)>)*(?<!=)>))*(?<!=)>)*(?<!=)>\\\\s*)?\\\\())","name":"meta.function-call.js","patterns":[{"include":"#function-call-target"}]},{"include":"#comment"},{"include":"#function-call-optionals"},{"include":"#type-arguments"},{"include":"#paren-expression"}]},{"begin":"(?=(((([$_[:alpha:]][$_[:alnum:]]*)(\\\\s*\\\\??\\\\.\\\\s*(#?[$_[:alpha:]][$_[:alnum:]]*))*)|(\\\\??\\\\.\\\\s*#?[$_[:alpha:]][$_[:alnum:]]*))|(?<=\\\\)))(<\\\\s*[(\\\\[{]\\\\s*)$)","end":"(?<=>)(?!(((([$_[:alpha:]][$_[:alnum:]]*)(\\\\s*\\\\??\\\\.\\\\s*(#?[$_[:alpha:]][$_[:alnum:]]*))*)|(\\\\??\\\\.\\\\s*#?[$_[:alpha:]][$_[:alnum:]]*))|(?<=\\\\)))(<\\\\s*[(\\\\[{]\\\\s*)$)","patterns":[{"begin":"(?=(([$_[:alpha:]][$_[:alnum:]]*)(\\\\s*\\\\??\\\\.\\\\s*(#?[$_[:alpha:]][$_[:alnum:]]*))*)|(\\\\??\\\\.\\\\s*#?[$_[:alpha:]][$_[:alnum:]]*))","end":"(?=(<\\\\s*[(\\\\[{]\\\\s*)$)","name":"meta.function-call.js","patterns":[{"include":"#function-call-target"}]},{"include":"#comment"},{"include":"#function-call-optionals"},{"include":"#type-arguments"}]}]},"function-call-optionals":{"patterns":[{"match":"\\\\?\\\\.","name":"meta.function-call.js punctuation.accessor.optional.js"},{"match":"!","name":"meta.function-call.js keyword.operator.definiteassignment.js"}]},"function-call-target":{"patterns":[{"include":"#support-function-call-identifiers"},{"match":"(#?[$_[:alpha:]][$_[:alnum:]]*)","name":"entity.name.function.js"}]},"function-declaration":{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:\\\\b(export)\\\\s+)?(?:\\\\b(declare)\\\\s+)?(?:(async)\\\\s+)?(function)\\\\b(?:\\\\s*(\\\\*))?(?:(?:\\\\s+|(?<=\\\\*))([$_[:alpha:]][$_[:alnum:]]*))?\\\\s*","beginCaptures":{"1":{"name":"keyword.control.export.js"},"2":{"name":"storage.modifier.js"},"3":{"name":"storage.modifier.async.js"},"4":{"name":"storage.type.function.js"},"5":{"name":"keyword.generator.asterisk.js"},"6":{"name":"meta.definition.function.js entity.name.function.js"}},"end":"(?=;|^\\\\s*$|^\\\\s*(?:abstract|async|\\\\bawait\\\\s+\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b\\\\b|break|case|catch|class|const|continue|declare|do|else|enum|export|finally|function|for|goto|if|import|interface|let|module|namespace|switch|return|throw|try|type|\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b|var|while)\\\\b)|(?<=})","name":"meta.function.js","patterns":[{"include":"#function-name"},{"include":"#function-body"}]},"function-expression":{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:(async)\\\\s+)?(function)\\\\b(?:\\\\s*(\\\\*))?(?:(?:\\\\s+|(?<=\\\\*))([$_[:alpha:]][$_[:alnum:]]*))?\\\\s*","beginCaptures":{"1":{"name":"storage.modifier.async.js"},"2":{"name":"storage.type.function.js"},"3":{"name":"keyword.generator.asterisk.js"},"4":{"name":"meta.definition.function.js entity.name.function.js"}},"end":"(?=;)|(?<=})","name":"meta.function.expression.js","patterns":[{"include":"#function-name"},{"include":"#single-line-comment-consuming-line-ending"},{"include":"#function-body"}]},"function-name":{"match":"[$_[:alpha:]][$_[:alnum:]]*","name":"meta.definition.function.js entity.name.function.js"},"function-parameters":{"begin":"\\\\(","beginCaptures":{"0":{"name":"punctuation.definition.parameters.begin.js"}},"end":"\\\\)","endCaptures":{"0":{"name":"punctuation.definition.parameters.end.js"}},"name":"meta.parameters.js","patterns":[{"include":"#function-parameters-body"}]},"function-parameters-body":{"patterns":[{"include":"#comment"},{"include":"#string"},{"include":"#decorator"},{"include":"#destructuring-parameter"},{"include":"#parameter-name"},{"include":"#parameter-type-annotation"},{"include":"#variable-initializer"},{"match":",","name":"punctuation.separator.parameter.js"}]},"identifiers":{"patterns":[{"include":"#object-identifiers"},{"captures":{"1":{"name":"punctuation.accessor.js"},"2":{"name":"punctuation.accessor.optional.js"},"3":{"name":"entity.name.function.js"}},"match":"(?:(?:(\\\\.)|(\\\\?\\\\.(?!\\\\s*\\\\d)))\\\\s*)?([$_[:alpha:]][$_[:alnum:]]*)(?=\\\\s*=\\\\s*(((async\\\\s+)?((function\\\\s*[(*<])|(function\\\\s+)|([$_[:alpha:]][$_[:alnum:]]*\\\\s*=>)))|((async\\\\s*)?(((<\\\\s*)$|(\\\\(\\\\s*((([\\\\[{]\\\\s*)?)$|((\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})\\\\s*((:\\\\s*\\\\{?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*)))|((\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])\\\\s*((:\\\\s*\\\\[?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*))))))|((<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*)?\\\\(\\\\s*(/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*)*((\\\\)\\\\s*:)|((\\\\.\\\\.\\\\.\\\\s*)?[$_[:alpha:]][$_[:alnum:]]*\\\\s*:)))|(<\\\\s*[$_[:alpha:]][$_[:alnum:]]*\\\\s+extends\\\\s*[^=>])|((<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*)?\\\\(\\\\s*(/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*)*(([$_[:alpha:]]|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])|(\\\\.\\\\.\\\\.\\\\s*[$_[:alpha:]]))([^\\"\'()`]|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`))*)?\\\\)(\\\\s*:\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+)?\\\\s*=>)))))"},{"captures":{"1":{"name":"punctuation.accessor.js"},"2":{"name":"punctuation.accessor.optional.js"},"3":{"name":"variable.other.constant.property.js"}},"match":"(?:(\\\\.)|(\\\\?\\\\.(?!\\\\s*\\\\d)))\\\\s*(#?\\\\p{upper}[$_\\\\d[:upper:]]*)(?![$_[:alnum:]])"},{"captures":{"1":{"name":"punctuation.accessor.js"},"2":{"name":"punctuation.accessor.optional.js"},"3":{"name":"variable.other.property.js"}},"match":"(?:(\\\\.)|(\\\\?\\\\.(?!\\\\s*\\\\d)))\\\\s*(#?[$_[:alpha:]][$_[:alnum:]]*)"},{"match":"(\\\\p{upper}[$_\\\\d[:upper:]]*)(?![$_[:alnum:]])","name":"variable.other.constant.js"},{"match":"[$_[:alpha:]][$_[:alnum:]]*","name":"variable.other.readwrite.js"}]},"if-statement":{"patterns":[{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?=\\\\bif\\\\s*(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))\\\\s*(?!\\\\{))","end":"(?=;|$|})","patterns":[{"include":"#comment"},{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(if)\\\\s*(\\\\()","beginCaptures":{"1":{"name":"keyword.control.conditional.js"},"2":{"name":"meta.brace.round.js"}},"end":"\\\\)","endCaptures":{"0":{"name":"meta.brace.round.js"}},"patterns":[{"include":"#expression"}]},{"begin":"(?<=\\\\))\\\\s*/(?![*/])(?=(?:[^/\\\\[\\\\\\\\]|\\\\\\\\.|\\\\[([^]\\\\\\\\]|\\\\\\\\.)*])+/([dgimsuvy]+|(?![*/])|(?=/\\\\*))(?!\\\\s*[$0-9A-Z_a-z]))","beginCaptures":{"0":{"name":"punctuation.definition.string.begin.js"}},"end":"(/)([dgimsuvy]*)","endCaptures":{"1":{"name":"punctuation.definition.string.end.js"},"2":{"name":"keyword.other.js"}},"name":"string.regexp.js","patterns":[{"include":"#regexp"}]},{"include":"#statements"}]}]},"import-declaration":{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:\\\\b(export)\\\\s+)?(?:\\\\b(declare)\\\\s+)?\\\\b(import)(?:\\\\s+(type)(?!\\\\s+from))?(?!\\\\s*[(:])(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","beginCaptures":{"1":{"name":"keyword.control.export.js"},"2":{"name":"storage.modifier.js"},"3":{"name":"keyword.control.import.js"},"4":{"name":"keyword.control.type.js"}},"end":"(?<!(?:^|[^$._[:alnum:]])import)(?=;|$|^)","name":"meta.import.js","patterns":[{"include":"#single-line-comment-consuming-line-ending"},{"include":"#comment"},{"include":"#string"},{"begin":"(?<=(?:^|[^$._[:alnum:]])import)(?!\\\\s*[\\"\'])","end":"\\\\bfrom\\\\b","endCaptures":{"0":{"name":"keyword.control.from.js"}},"patterns":[{"include":"#import-export-declaration"}]},{"include":"#import-export-declaration"}]},"import-equals-declaration":{"patterns":[{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:\\\\b(export)\\\\s+)?(?:\\\\b(declare)\\\\s+)?\\\\b(import)(?:\\\\s+(type))?\\\\s+([$_[:alpha:]][$_[:alnum:]]*)\\\\s*(=)\\\\s*(require)\\\\s*(\\\\()","beginCaptures":{"1":{"name":"keyword.control.export.js"},"2":{"name":"storage.modifier.js"},"3":{"name":"keyword.control.import.js"},"4":{"name":"keyword.control.type.js"},"5":{"name":"variable.other.readwrite.alias.js"},"6":{"name":"keyword.operator.assignment.js"},"7":{"name":"keyword.control.require.js"},"8":{"name":"meta.brace.round.js"}},"end":"\\\\)","endCaptures":{"0":{"name":"meta.brace.round.js"}},"name":"meta.import-equals.external.js","patterns":[{"include":"#comment"},{"include":"#string"}]},{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:\\\\b(export)\\\\s+)?(?:\\\\b(declare)\\\\s+)?\\\\b(import)(?:\\\\s+(type))?\\\\s+([$_[:alpha:]][$_[:alnum:]]*)\\\\s*(=)\\\\s*(?!require\\\\b)","beginCaptures":{"1":{"name":"keyword.control.export.js"},"2":{"name":"storage.modifier.js"},"3":{"name":"keyword.control.import.js"},"4":{"name":"keyword.control.type.js"},"5":{"name":"variable.other.readwrite.alias.js"},"6":{"name":"keyword.operator.assignment.js"}},"end":"(?=;|$|^)","name":"meta.import-equals.internal.js","patterns":[{"include":"#single-line-comment-consuming-line-ending"},{"include":"#comment"},{"captures":{"1":{"name":"entity.name.type.module.js"},"2":{"name":"punctuation.accessor.js"},"3":{"name":"punctuation.accessor.optional.js"}},"match":"([$_[:alpha:]][$_[:alnum:]]*)\\\\s*(?:(\\\\.)|(\\\\?\\\\.(?!\\\\s*\\\\d)))"},{"match":"([$_[:alpha:]][$_[:alnum:]]*)","name":"variable.other.readwrite.js"}]}]},"import-export-assert-clause":{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:(with)|(assert))\\\\s*(\\\\{)","beginCaptures":{"1":{"name":"keyword.control.with.js"},"2":{"name":"keyword.control.assert.js"},"3":{"name":"punctuation.definition.block.js"}},"end":"}","endCaptures":{"0":{"name":"punctuation.definition.block.js"}},"patterns":[{"include":"#comment"},{"include":"#string"},{"match":"[$_[:alpha:]][$_[:alnum:]]*\\\\s*(?=(/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*)*:)","name":"meta.object-literal.key.js"},{"match":":","name":"punctuation.separator.key-value.js"}]},"import-export-block":{"begin":"\\\\{","beginCaptures":{"0":{"name":"punctuation.definition.block.js"}},"end":"}","endCaptures":{"0":{"name":"punctuation.definition.block.js"}},"name":"meta.block.js","patterns":[{"include":"#import-export-clause"}]},"import-export-clause":{"patterns":[{"include":"#comment"},{"captures":{"1":{"name":"keyword.control.type.js"},"2":{"name":"keyword.control.default.js"},"3":{"name":"constant.language.import-export-all.js"},"4":{"name":"variable.other.readwrite.js"},"5":{"name":"string.quoted.alias.js"},"12":{"name":"keyword.control.as.js"},"13":{"name":"keyword.control.default.js"},"14":{"name":"variable.other.readwrite.alias.js"},"15":{"name":"string.quoted.alias.js"}},"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:\\\\b(type)\\\\s+)?(?:\\\\b(default)|(\\\\*)|\\\\b([$_[:alpha:]][$_[:alnum:]]*)|((\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`)))\\\\s+(as)\\\\s+(?:(default(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.)))|([$_[:alpha:]][$_[:alnum:]]*)|((\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`)))"},{"include":"#punctuation-comma"},{"match":"\\\\*","name":"constant.language.import-export-all.js"},{"match":"\\\\b(default)\\\\b","name":"keyword.control.default.js"},{"captures":{"1":{"name":"keyword.control.type.js"},"2":{"name":"variable.other.readwrite.alias.js"},"3":{"name":"string.quoted.alias.js"}},"match":"(?:\\\\b(type)\\\\s+)?(?:([$_[:alpha:]][$_[:alnum:]]*)|((\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`)))"}]},"import-export-declaration":{"patterns":[{"include":"#comment"},{"include":"#string"},{"include":"#import-export-block"},{"match":"\\\\bfrom\\\\b","name":"keyword.control.from.js"},{"include":"#import-export-assert-clause"},{"include":"#import-export-clause"}]},"indexer-declaration":{"begin":"(?:(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(readonly)\\\\s*)?\\\\s*(\\\\[)\\\\s*([$_[:alpha:]][$_[:alnum:]]*)\\\\s*(?=:)","beginCaptures":{"1":{"name":"storage.modifier.js"},"2":{"name":"meta.brace.square.js"},"3":{"name":"variable.parameter.js"}},"end":"(])\\\\s*(\\\\?\\\\s*)?|$","endCaptures":{"1":{"name":"meta.brace.square.js"},"2":{"name":"keyword.operator.optional.js"}},"name":"meta.indexer.declaration.js","patterns":[{"include":"#type-annotation"}]},"indexer-mapped-type-declaration":{"begin":"(?:(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))([-+])?(readonly)\\\\s*)?\\\\s*(\\\\[)\\\\s*([$_[:alpha:]][$_[:alnum:]]*)\\\\s+(in)\\\\s+","beginCaptures":{"1":{"name":"keyword.operator.type.modifier.js"},"2":{"name":"storage.modifier.js"},"3":{"name":"meta.brace.square.js"},"4":{"name":"entity.name.type.js"},"5":{"name":"keyword.operator.expression.in.js"}},"end":"(])([-+])?\\\\s*(\\\\?\\\\s*)?|$","endCaptures":{"1":{"name":"meta.brace.square.js"},"2":{"name":"keyword.operator.type.modifier.js"},"3":{"name":"keyword.operator.optional.js"}},"name":"meta.indexer.mappedtype.declaration.js","patterns":[{"captures":{"1":{"name":"keyword.control.as.js"}},"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(as)\\\\s+"},{"include":"#type"}]},"inline-tags":{"patterns":[{"captures":{"1":{"name":"punctuation.definition.bracket.square.begin.jsdoc"},"2":{"name":"punctuation.definition.bracket.square.end.jsdoc"}},"match":"(\\\\[)[^]]+(])(?=\\\\{@(?:link|linkcode|linkplain|tutorial))","name":"constant.other.description.jsdoc"},{"begin":"(\\\\{)((@)(?:link(?:code|plain)?|tutorial))\\\\s*","beginCaptures":{"1":{"name":"punctuation.definition.bracket.curly.begin.jsdoc"},"2":{"name":"storage.type.class.jsdoc"},"3":{"name":"punctuation.definition.inline.tag.jsdoc"}},"end":"}|(?=\\\\*/)","endCaptures":{"0":{"name":"punctuation.definition.bracket.curly.end.jsdoc"}},"name":"entity.name.type.instance.jsdoc","patterns":[{"captures":{"1":{"name":"variable.other.link.underline.jsdoc"},"2":{"name":"punctuation.separator.pipe.jsdoc"}},"match":"\\\\G((?=https?://)(?:[^*|}\\\\s]|\\\\*/)+)(\\\\|)?"},{"captures":{"1":{"name":"variable.other.description.jsdoc"},"2":{"name":"punctuation.separator.pipe.jsdoc"}},"match":"\\\\G((?:[^*@{|}\\\\s]|\\\\*[^/])+)(\\\\|)?"}]}]},"instanceof-expr":{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(instanceof)(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","beginCaptures":{"1":{"name":"keyword.operator.expression.instanceof.js"}},"end":"(?<=\\\\))|(?=[-\\\\])+,:;>?}]|\\\\|\\\\||&&|!==|$|([!=]==?)|(([\\\\&^|~]\\\\s*)?[$_[:alpha:]][$_[:alnum:]]*\\\\s+instanceof(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.)))|((?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))function((\\\\s+[$_[:alpha:]][$_[:alnum:]]*)|(\\\\s*\\\\())))","patterns":[{"include":"#type"}]},"interface-declaration":{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:\\\\b(export)\\\\s+)?(?:\\\\b(declare)\\\\s+)?\\\\b(?:(abstract)\\\\s+)?\\\\b(interface)\\\\b(?=\\\\s+|/[*/])","beginCaptures":{"1":{"name":"keyword.control.export.js"},"2":{"name":"storage.modifier.js"},"3":{"name":"storage.modifier.js"},"4":{"name":"storage.type.interface.js"}},"end":"(?<=})","name":"meta.interface.js","patterns":[{"include":"#comment"},{"include":"#class-or-interface-heritage"},{"captures":{"0":{"name":"entity.name.type.interface.js"}},"match":"[$_[:alpha:]][$_[:alnum:]]*"},{"include":"#type-parameters"},{"include":"#class-or-interface-body"}]},"jsdoctype":{"patterns":[{"begin":"\\\\G(\\\\{)","beginCaptures":{"0":{"name":"entity.name.type.instance.jsdoc"},"1":{"name":"punctuation.definition.bracket.curly.begin.jsdoc"}},"contentName":"entity.name.type.instance.jsdoc","end":"((}))\\\\s*|(?=\\\\*/)","endCaptures":{"1":{"name":"entity.name.type.instance.jsdoc"},"2":{"name":"punctuation.definition.bracket.curly.end.jsdoc"}},"patterns":[{"include":"#brackets"}]}]},"jsx":{"patterns":[{"include":"#jsx-tag-without-attributes-in-expression"},{"include":"#jsx-tag-in-expression"}]},"jsx-children":{"patterns":[{"include":"#jsx-tag-without-attributes"},{"include":"#jsx-tag"},{"include":"#jsx-evaluated-code"},{"include":"#jsx-entities"}]},"jsx-entities":{"patterns":[{"captures":{"1":{"name":"punctuation.definition.entity.js"},"3":{"name":"punctuation.definition.entity.js"}},"match":"(&)([0-9A-Za-z]+|#[0-9]+|#x\\\\h+)(;)","name":"constant.character.entity.js"}]},"jsx-evaluated-code":{"begin":"\\\\{","beginCaptures":{"0":{"name":"punctuation.section.embedded.begin.js"}},"contentName":"meta.embedded.expression.js","end":"}","endCaptures":{"0":{"name":"punctuation.section.embedded.end.js"}},"patterns":[{"include":"#expression"}]},"jsx-string-double-quoted":{"begin":"\\"","beginCaptures":{"0":{"name":"punctuation.definition.string.begin.js"}},"end":"\\"","endCaptures":{"0":{"name":"punctuation.definition.string.end.js"}},"name":"string.quoted.double.js","patterns":[{"include":"#jsx-entities"}]},"jsx-string-single-quoted":{"begin":"\'","beginCaptures":{"0":{"name":"punctuation.definition.string.begin.js"}},"end":"\'","endCaptures":{"0":{"name":"punctuation.definition.string.end.js"}},"name":"string.quoted.single.js","patterns":[{"include":"#jsx-entities"}]},"jsx-tag":{"begin":"(?=(<)\\\\s*(?:([$_[:alpha:]][-$._[:alnum:]]*)(?<![-.])(:))?((?:[a-z][0-9a-z]*|([$_[:alpha:]][-$._[:alnum:]]*))(?<![-.]))(?=((<\\\\s*)|(\\\\s+))(?!\\\\?)|/?>))","end":"(/>)|(</)\\\\s*(?:([$_[:alpha:]][-$._[:alnum:]]*)(?<![-.])(:))?((?:[a-z][0-9a-z]*|([$_[:alpha:]][-$._[:alnum:]]*))(?<![-.]))?\\\\s*(>)","endCaptures":{"1":{"name":"punctuation.definition.tag.end.js"},"2":{"name":"punctuation.definition.tag.begin.js"},"3":{"name":"entity.name.tag.namespace.js"},"4":{"name":"punctuation.separator.namespace.js"},"5":{"name":"entity.name.tag.js"},"6":{"name":"support.class.component.js"},"7":{"name":"punctuation.definition.tag.end.js"}},"name":"meta.tag.js","patterns":[{"begin":"(<)\\\\s*(?:([$_[:alpha:]][-$._[:alnum:]]*)(?<![-.])(:))?((?:[a-z][0-9a-z]*|([$_[:alpha:]][-$._[:alnum:]]*))(?<![-.]))(?=((<\\\\s*)|(\\\\s+))(?!\\\\?)|/?>)","beginCaptures":{"1":{"name":"punctuation.definition.tag.begin.js"},"2":{"name":"entity.name.tag.namespace.js"},"3":{"name":"punctuation.separator.namespace.js"},"4":{"name":"entity.name.tag.js"},"5":{"name":"support.class.component.js"}},"end":"(?=/?>)","patterns":[{"include":"#comment"},{"include":"#type-arguments"},{"include":"#jsx-tag-attributes"}]},{"begin":"(>)","beginCaptures":{"1":{"name":"punctuation.definition.tag.end.js"}},"contentName":"meta.jsx.children.js","end":"(?=</)","patterns":[{"include":"#jsx-children"}]}]},"jsx-tag-attribute-assignment":{"match":"=(?=\\\\s*(?:[\\"\'{]|/\\\\*|//|\\\\n))","name":"keyword.operator.assignment.js"},"jsx-tag-attribute-name":{"captures":{"1":{"name":"entity.other.attribute-name.namespace.js"},"2":{"name":"punctuation.separator.namespace.js"},"3":{"name":"entity.other.attribute-name.js"}},"match":"\\\\s*(?:([$_[:alpha:]][-$._[:alnum:]]*)(:))?([$_[:alpha:]][-$_[:alnum:]]*)(?=[=\\\\s]|/?>|/\\\\*|//)"},"jsx-tag-attributes":{"begin":"\\\\s+","end":"(?=/?>)","name":"meta.tag.attributes.js","patterns":[{"include":"#comment"},{"include":"#jsx-tag-attribute-name"},{"include":"#jsx-tag-attribute-assignment"},{"include":"#jsx-string-double-quoted"},{"include":"#jsx-string-single-quoted"},{"include":"#jsx-evaluated-code"},{"include":"#jsx-tag-attributes-illegal"}]},"jsx-tag-attributes-illegal":{"match":"\\\\S+","name":"invalid.illegal.attribute.js"},"jsx-tag-in-expression":{"begin":"(?<!\\\\+\\\\+|--)(?<=[(*,:=>?\\\\[{]|&&|\\\\|\\\\||\\\\?|\\\\*/|^await|[^$._[:alnum:]]await|^return|[^$._[:alnum:]]return|^default|[^$._[:alnum:]]default|^yield|[^$._[:alnum:]]yield|^)\\\\s*(?!<\\\\s*[$_[:alpha:]][$_[:alnum:]]*((\\\\s+extends\\\\s+[^=>])|,))(?=(<)\\\\s*(?:([$_[:alpha:]][-$._[:alnum:]]*)(?<![-.])(:))?((?:[a-z][0-9a-z]*|([$_[:alpha:]][-$._[:alnum:]]*))(?<![-.]))(?=((<\\\\s*)|(\\\\s+))(?!\\\\?)|/?>))","end":"(?!(<)\\\\s*(?:([$_[:alpha:]][-$._[:alnum:]]*)(?<![-.])(:))?((?:[a-z][0-9a-z]*|([$_[:alpha:]][-$._[:alnum:]]*))(?<![-.]))(?=((<\\\\s*)|(\\\\s+))(?!\\\\?)|/?>))","patterns":[{"include":"#jsx-tag"}]},"jsx-tag-without-attributes":{"begin":"(<)\\\\s*(?:([$_[:alpha:]][-$._[:alnum:]]*)(?<![-.])(:))?((?:[a-z][0-9a-z]*|([$_[:alpha:]][-$._[:alnum:]]*))(?<![-.]))?\\\\s*(>)","beginCaptures":{"1":{"name":"punctuation.definition.tag.begin.js"},"2":{"name":"entity.name.tag.namespace.js"},"3":{"name":"punctuation.separator.namespace.js"},"4":{"name":"entity.name.tag.js"},"5":{"name":"support.class.component.js"},"6":{"name":"punctuation.definition.tag.end.js"}},"contentName":"meta.jsx.children.js","end":"(</)\\\\s*(?:([$_[:alpha:]][-$._[:alnum:]]*)(?<![-.])(:))?((?:[a-z][0-9a-z]*|([$_[:alpha:]][-$._[:alnum:]]*))(?<![-.]))?\\\\s*(>)","endCaptures":{"1":{"name":"punctuation.definition.tag.begin.js"},"2":{"name":"entity.name.tag.namespace.js"},"3":{"name":"punctuation.separator.namespace.js"},"4":{"name":"entity.name.tag.js"},"5":{"name":"support.class.component.js"},"6":{"name":"punctuation.definition.tag.end.js"}},"name":"meta.tag.without-attributes.js","patterns":[{"include":"#jsx-children"}]},"jsx-tag-without-attributes-in-expression":{"begin":"(?<!\\\\+\\\\+|--)(?<=[(*,:=>?\\\\[{]|&&|\\\\|\\\\||\\\\?|\\\\*/|^await|[^$._[:alnum:]]await|^return|[^$._[:alnum:]]return|^default|[^$._[:alnum:]]default|^yield|[^$._[:alnum:]]yield|^)\\\\s*(?=(<)\\\\s*(?:([$_[:alpha:]][-$._[:alnum:]]*)(?<![-.])(:))?((?:[a-z][0-9a-z]*|([$_[:alpha:]][-$._[:alnum:]]*))(?<![-.]))?\\\\s*(>))","end":"(?!(<)\\\\s*(?:([$_[:alpha:]][-$._[:alnum:]]*)(?<![-.])(:))?((?:[a-z][0-9a-z]*|([$_[:alpha:]][-$._[:alnum:]]*))(?<![-.]))?\\\\s*(>))","patterns":[{"include":"#jsx-tag-without-attributes"}]},"label":{"patterns":[{"begin":"([$_[:alpha:]][$_[:alnum:]]*)\\\\s*(:)(?=\\\\s*\\\\{)","beginCaptures":{"1":{"name":"entity.name.label.js"},"2":{"name":"punctuation.separator.label.js"}},"end":"(?<=})","patterns":[{"include":"#decl-block"}]},{"captures":{"1":{"name":"entity.name.label.js"},"2":{"name":"punctuation.separator.label.js"}},"match":"([$_[:alpha:]][$_[:alnum:]]*)\\\\s*(:)"}]},"literal":{"patterns":[{"include":"#numeric-literal"},{"include":"#boolean-literal"},{"include":"#null-literal"},{"include":"#undefined-literal"},{"include":"#numericConstant-literal"},{"include":"#array-literal"},{"include":"#this-literal"},{"include":"#super-literal"}]},"method-declaration":{"patterns":[{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:\\\\b(override)\\\\s+)?(?:\\\\b(p(?:ublic|rivate|rotected))\\\\s+)?(?:\\\\b(abstract)\\\\s+)?(?:\\\\b(async)\\\\s+)?\\\\s*\\\\b(constructor)\\\\b(?!:)(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","beginCaptures":{"1":{"name":"storage.modifier.js"},"2":{"name":"storage.modifier.js"},"3":{"name":"storage.modifier.js"},"4":{"name":"storage.modifier.async.js"},"5":{"name":"storage.type.js"}},"end":"(?=[,;}]|$)|(?<=})","name":"meta.method.declaration.js","patterns":[{"include":"#method-declaration-name"},{"include":"#function-body"}]},{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:\\\\b(override)\\\\s+)?(?:\\\\b(p(?:ublic|rivate|rotected))\\\\s+)?(?:\\\\b(abstract)\\\\s+)?(?:\\\\b(async)\\\\s+)?(?:\\\\s*\\\\b(new)\\\\b(?!:)(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))|(?:(\\\\*)\\\\s*)?)(?=\\\\s*((<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*))?\\\\()","beginCaptures":{"1":{"name":"storage.modifier.js"},"2":{"name":"storage.modifier.js"},"3":{"name":"storage.modifier.js"},"4":{"name":"storage.modifier.async.js"},"5":{"name":"keyword.operator.new.js"},"6":{"name":"keyword.generator.asterisk.js"}},"end":"(?=[,;}]|$)|(?<=})","name":"meta.method.declaration.js","patterns":[{"include":"#method-declaration-name"},{"include":"#function-body"}]},{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:\\\\b(override)\\\\s+)?(?:\\\\b(p(?:ublic|rivate|rotected))\\\\s+)?(?:\\\\b(abstract)\\\\s+)?(?:\\\\b(async)\\\\s+)?(?:\\\\b([gs]et)\\\\s+)?(?:(\\\\*)\\\\s*)?(?=\\\\s*((\\\\b((?<!\\\\$)0[Xx]\\\\h[_\\\\h]*(n)?\\\\b(?!\\\\$))|\\\\b((?<!\\\\$)0[Bb][01][01_]*(n)?\\\\b(?!\\\\$))|\\\\b((?<!\\\\$)0[Oo]?[0-7][0-7_]*(n)?\\\\b(?!\\\\$))|((?<!\\\\$)(?:\\\\b[0-9][0-9_]*(\\\\.)[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\B(\\\\.)[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)(n)?\\\\B|\\\\B(\\\\.)[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(n)?\\\\b(?!\\\\.))(?!\\\\$))|([$_[:alpha:]][$_[:alnum:]]*)|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`)|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])+]))\\\\s*(\\\\??))\\\\s*((<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*))?\\\\()","beginCaptures":{"1":{"name":"storage.modifier.js"},"2":{"name":"storage.modifier.js"},"3":{"name":"storage.modifier.js"},"4":{"name":"storage.modifier.async.js"},"5":{"name":"storage.type.property.js"},"6":{"name":"keyword.generator.asterisk.js"}},"end":"(?=[,;}]|$)|(?<=})","name":"meta.method.declaration.js","patterns":[{"include":"#method-declaration-name"},{"include":"#function-body"}]}]},"method-declaration-name":{"begin":"(?=(\\\\b((?<!\\\\$)0[Xx]\\\\h[_\\\\h]*(n)?\\\\b(?!\\\\$))|\\\\b((?<!\\\\$)0[Bb][01][01_]*(n)?\\\\b(?!\\\\$))|\\\\b((?<!\\\\$)0[Oo]?[0-7][0-7_]*(n)?\\\\b(?!\\\\$))|((?<!\\\\$)(?:\\\\b[0-9][0-9_]*(\\\\.)[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\B(\\\\.)[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)(n)?\\\\B|\\\\B(\\\\.)[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(n)?\\\\b(?!\\\\.))(?!\\\\$))|([$_[:alpha:]][$_[:alnum:]]*)|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`)|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])+]))\\\\s*(\\\\??)\\\\s*[(<])","end":"(?=[(<])","patterns":[{"include":"#string"},{"include":"#array-literal"},{"include":"#numeric-literal"},{"match":"[$_[:alpha:]][$_[:alnum:]]*","name":"meta.definition.method.js entity.name.function.js"},{"match":"\\\\?","name":"keyword.operator.optional.js"}]},"namespace-declaration":{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:\\\\b(export)\\\\s+)?(?:\\\\b(declare)\\\\s+)?\\\\b(namespace|module)\\\\s+(?=[\\"$\'_`[:alpha:]])","beginCaptures":{"1":{"name":"keyword.control.export.js"},"2":{"name":"storage.modifier.js"},"3":{"name":"storage.type.namespace.js"}},"end":"(?<=})|(?=;|^\\\\s*$|^\\\\s*(?:abstract|async|\\\\bawait\\\\s+\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b\\\\b|break|case|catch|class|const|continue|declare|do|else|enum|export|finally|function|for|goto|if|import|interface|let|module|namespace|switch|return|throw|try|type|\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b|var|while)\\\\b)","name":"meta.namespace.declaration.js","patterns":[{"include":"#comment"},{"include":"#string"},{"match":"([$_[:alpha:]][$_[:alnum:]]*)","name":"entity.name.type.module.js"},{"include":"#punctuation-accessor"},{"include":"#decl-block"}]},"new-expr":{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(new)(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","beginCaptures":{"1":{"name":"keyword.operator.new.js"}},"end":"(?<=\\\\))|(?=[-\\\\])+,:;>?}]|\\\\|\\\\||&&|!==|$|((?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))new(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.)))|((?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))function((\\\\s+[$_[:alpha:]][$_[:alnum:]]*)|(\\\\s*\\\\())))","name":"new.expr.js","patterns":[{"include":"#expression"}]},"null-literal":{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))null(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","name":"constant.language.null.js"},"numeric-literal":{"patterns":[{"captures":{"1":{"name":"storage.type.numeric.bigint.js"}},"match":"\\\\b(?<!\\\\$)0[Xx]\\\\h[_\\\\h]*(n)?\\\\b(?!\\\\$)","name":"constant.numeric.hex.js"},{"captures":{"1":{"name":"storage.type.numeric.bigint.js"}},"match":"\\\\b(?<!\\\\$)0[Bb][01][01_]*(n)?\\\\b(?!\\\\$)","name":"constant.numeric.binary.js"},{"captures":{"1":{"name":"storage.type.numeric.bigint.js"}},"match":"\\\\b(?<!\\\\$)0[Oo]?[0-7][0-7_]*(n)?\\\\b(?!\\\\$)","name":"constant.numeric.octal.js"},{"captures":{"0":{"name":"constant.numeric.decimal.js"},"1":{"name":"meta.delimiter.decimal.period.js"},"2":{"name":"storage.type.numeric.bigint.js"},"3":{"name":"meta.delimiter.decimal.period.js"},"4":{"name":"storage.type.numeric.bigint.js"},"5":{"name":"meta.delimiter.decimal.period.js"},"6":{"name":"storage.type.numeric.bigint.js"},"7":{"name":"storage.type.numeric.bigint.js"},"8":{"name":"meta.delimiter.decimal.period.js"},"9":{"name":"storage.type.numeric.bigint.js"},"10":{"name":"meta.delimiter.decimal.period.js"},"11":{"name":"storage.type.numeric.bigint.js"},"12":{"name":"meta.delimiter.decimal.period.js"},"13":{"name":"storage.type.numeric.bigint.js"},"14":{"name":"storage.type.numeric.bigint.js"}},"match":"(?<!\\\\$)(?:\\\\b[0-9][0-9_]*(\\\\.)[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\B(\\\\.)[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)(n)?\\\\B|\\\\B(\\\\.)[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(n)?\\\\b(?!\\\\.))(?!\\\\$)"}]},"numericConstant-literal":{"patterns":[{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))NaN(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","name":"constant.language.nan.js"},{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))Infinity(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","name":"constant.language.infinity.js"}]},"object-binding-element":{"patterns":[{"include":"#comment"},{"begin":"(?=(\\\\b((?<!\\\\$)0[Xx]\\\\h[_\\\\h]*(n)?\\\\b(?!\\\\$))|\\\\b((?<!\\\\$)0[Bb][01][01_]*(n)?\\\\b(?!\\\\$))|\\\\b((?<!\\\\$)0[Oo]?[0-7][0-7_]*(n)?\\\\b(?!\\\\$))|((?<!\\\\$)(?:\\\\b[0-9][0-9_]*(\\\\.)[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\B(\\\\.)[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)(n)?\\\\B|\\\\B(\\\\.)[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(n)?\\\\b(?!\\\\.))(?!\\\\$))|([$_[:alpha:]][$_[:alnum:]]*)|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`)|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])+]))\\\\s*(:))","end":"(?=[,}])","patterns":[{"include":"#object-binding-element-propertyName"},{"include":"#binding-element"}]},{"include":"#object-binding-pattern"},{"include":"#destructuring-variable-rest"},{"include":"#variable-initializer"},{"include":"#punctuation-comma"}]},"object-binding-element-const":{"patterns":[{"include":"#comment"},{"begin":"(?=(\\\\b((?<!\\\\$)0[Xx]\\\\h[_\\\\h]*(n)?\\\\b(?!\\\\$))|\\\\b((?<!\\\\$)0[Bb][01][01_]*(n)?\\\\b(?!\\\\$))|\\\\b((?<!\\\\$)0[Oo]?[0-7][0-7_]*(n)?\\\\b(?!\\\\$))|((?<!\\\\$)(?:\\\\b[0-9][0-9_]*(\\\\.)[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\B(\\\\.)[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)(n)?\\\\B|\\\\B(\\\\.)[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(n)?\\\\b(?!\\\\.))(?!\\\\$))|([$_[:alpha:]][$_[:alnum:]]*)|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`)|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])+]))\\\\s*(:))","end":"(?=[,}])","patterns":[{"include":"#object-binding-element-propertyName"},{"include":"#binding-element-const"}]},{"include":"#object-binding-pattern-const"},{"include":"#destructuring-variable-rest-const"},{"include":"#variable-initializer"},{"include":"#punctuation-comma"}]},"object-binding-element-propertyName":{"begin":"(?=(\\\\b((?<!\\\\$)0[Xx]\\\\h[_\\\\h]*(n)?\\\\b(?!\\\\$))|\\\\b((?<!\\\\$)0[Bb][01][01_]*(n)?\\\\b(?!\\\\$))|\\\\b((?<!\\\\$)0[Oo]?[0-7][0-7_]*(n)?\\\\b(?!\\\\$))|((?<!\\\\$)(?:\\\\b[0-9][0-9_]*(\\\\.)[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\B(\\\\.)[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)(n)?\\\\B|\\\\B(\\\\.)[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(n)?\\\\b(?!\\\\.))(?!\\\\$))|([$_[:alpha:]][$_[:alnum:]]*)|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`)|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])+]))\\\\s*(:))","end":"(:)","endCaptures":{"0":{"name":"punctuation.destructuring.js"}},"patterns":[{"include":"#string"},{"include":"#array-literal"},{"include":"#numeric-literal"},{"match":"([$_[:alpha:]][$_[:alnum:]]*)","name":"variable.object.property.js"}]},"object-binding-pattern":{"begin":"(?:(\\\\.\\\\.\\\\.)\\\\s*)?(\\\\{)","beginCaptures":{"1":{"name":"keyword.operator.rest.js"},"2":{"name":"punctuation.definition.binding-pattern.object.js"}},"end":"}","endCaptures":{"0":{"name":"punctuation.definition.binding-pattern.object.js"}},"patterns":[{"include":"#object-binding-element"}]},"object-binding-pattern-const":{"begin":"(?:(\\\\.\\\\.\\\\.)\\\\s*)?(\\\\{)","beginCaptures":{"1":{"name":"keyword.operator.rest.js"},"2":{"name":"punctuation.definition.binding-pattern.object.js"}},"end":"}","endCaptures":{"0":{"name":"punctuation.definition.binding-pattern.object.js"}},"patterns":[{"include":"#object-binding-element-const"}]},"object-identifiers":{"patterns":[{"match":"([$_[:alpha:]][$_[:alnum:]]*)(?=\\\\s*\\\\??\\\\.\\\\s*prototype\\\\b(?!\\\\$))","name":"support.class.js"},{"captures":{"1":{"name":"punctuation.accessor.js"},"2":{"name":"punctuation.accessor.optional.js"},"3":{"name":"variable.other.constant.object.property.js"},"4":{"name":"variable.other.object.property.js"}},"match":"(?:(\\\\.)|(\\\\?\\\\.(?!\\\\s*\\\\d)))\\\\s*(?:(#?\\\\p{upper}[$_\\\\d[:upper:]]*)|(#?[$_[:alpha:]][$_[:alnum:]]*))(?=\\\\s*\\\\??\\\\.\\\\s*#?[$_[:alpha:]][$_[:alnum:]]*)"},{"captures":{"1":{"name":"variable.other.constant.object.js"},"2":{"name":"variable.other.object.js"}},"match":"(?:(\\\\p{upper}[$_\\\\d[:upper:]]*)|([$_[:alpha:]][$_[:alnum:]]*))(?=\\\\s*\\\\??\\\\.\\\\s*#?[$_[:alpha:]][$_[:alnum:]]*)"}]},"object-literal":{"begin":"\\\\{","beginCaptures":{"0":{"name":"punctuation.definition.block.js"}},"end":"}","endCaptures":{"0":{"name":"punctuation.definition.block.js"}},"name":"meta.objectliteral.js","patterns":[{"include":"#object-member"}]},"object-literal-method-declaration":{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:\\\\b(async)\\\\s+)?(?:\\\\b([gs]et)\\\\s+)?(?:(\\\\*)\\\\s*)?(?=\\\\s*((\\\\b((?<!\\\\$)0[Xx]\\\\h[_\\\\h]*(n)?\\\\b(?!\\\\$))|\\\\b((?<!\\\\$)0[Bb][01][01_]*(n)?\\\\b(?!\\\\$))|\\\\b((?<!\\\\$)0[Oo]?[0-7][0-7_]*(n)?\\\\b(?!\\\\$))|((?<!\\\\$)(?:\\\\b[0-9][0-9_]*(\\\\.)[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\B(\\\\.)[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)(n)?\\\\B|\\\\B(\\\\.)[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(n)?\\\\b(?!\\\\.))(?!\\\\$))|([$_[:alpha:]][$_[:alnum:]]*)|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`)|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])+]))\\\\s*(\\\\??))\\\\s*((<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*))?\\\\()","beginCaptures":{"1":{"name":"storage.modifier.async.js"},"2":{"name":"storage.type.property.js"},"3":{"name":"keyword.generator.asterisk.js"}},"end":"(?=[,;}])|(?<=})","name":"meta.method.declaration.js","patterns":[{"include":"#method-declaration-name"},{"include":"#function-body"},{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:\\\\b(async)\\\\s+)?(?:\\\\b([gs]et)\\\\s+)?(?:(\\\\*)\\\\s*)?(?=\\\\s*((\\\\b((?<!\\\\$)0[Xx]\\\\h[_\\\\h]*(n)?\\\\b(?!\\\\$))|\\\\b((?<!\\\\$)0[Bb][01][01_]*(n)?\\\\b(?!\\\\$))|\\\\b((?<!\\\\$)0[Oo]?[0-7][0-7_]*(n)?\\\\b(?!\\\\$))|((?<!\\\\$)(?:\\\\b[0-9][0-9_]*(\\\\.)[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\B(\\\\.)[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)(n)?\\\\B|\\\\B(\\\\.)[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(n)?\\\\b(?!\\\\.))(?!\\\\$))|([$_[:alpha:]][$_[:alnum:]]*)|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`)|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])+]))\\\\s*(\\\\??))\\\\s*((<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*))?\\\\()","beginCaptures":{"1":{"name":"storage.modifier.async.js"},"2":{"name":"storage.type.property.js"},"3":{"name":"keyword.generator.asterisk.js"}},"end":"(?=[(<])","patterns":[{"include":"#method-declaration-name"}]}]},"object-member":{"patterns":[{"include":"#comment"},{"include":"#object-literal-method-declaration"},{"begin":"(?=\\\\[)","end":"(?=:)|((?<=])(?=\\\\s*[(<]))","name":"meta.object.member.js meta.object-literal.key.js","patterns":[{"include":"#comment"},{"include":"#array-literal"}]},{"begin":"(?=[\\"\'`])","end":"(?=:)|((?<=[\\"\'`])(?=((\\\\s*[(,<}])|(\\\\s+(as|satisifies)\\\\s+))))","name":"meta.object.member.js meta.object-literal.key.js","patterns":[{"include":"#comment"},{"include":"#string"}]},{"begin":"(?=\\\\b((?<!\\\\$)0[Xx]\\\\h[_\\\\h]*(n)?\\\\b(?!\\\\$))|\\\\b((?<!\\\\$)0[Bb][01][01_]*(n)?\\\\b(?!\\\\$))|\\\\b((?<!\\\\$)0[Oo]?[0-7][0-7_]*(n)?\\\\b(?!\\\\$))|((?<!\\\\$)(?:\\\\b[0-9][0-9_]*(\\\\.)[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\B(\\\\.)[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)(n)?\\\\B|\\\\B(\\\\.)[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(n)?\\\\b(?!\\\\.))(?!\\\\$)))","end":"(?=:)|(?=\\\\s*([(,<}])|(\\\\s+as|satisifies\\\\s+))","name":"meta.object.member.js meta.object-literal.key.js","patterns":[{"include":"#comment"},{"include":"#numeric-literal"}]},{"begin":"(?<=[]\\"\'`])(?=\\\\s*[(<])","end":"(?=[,;}])|(?<=})","name":"meta.method.declaration.js","patterns":[{"include":"#function-body"}]},{"captures":{"0":{"name":"meta.object-literal.key.js"},"1":{"name":"constant.numeric.decimal.js"}},"match":"(?![$_[:alpha:]])(\\\\d+)\\\\s*(?=(/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*)*:)","name":"meta.object.member.js"},{"captures":{"0":{"name":"meta.object-literal.key.js"},"1":{"name":"entity.name.function.js"}},"match":"([$_[:alpha:]][$_[:alnum:]]*)\\\\s*(?=(/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*)*:(\\\\s*/\\\\*([^*]|(\\\\*[^/]))*\\\\*/)*\\\\s*(((async\\\\s+)?((function\\\\s*[(*<])|(function\\\\s+)|([$_[:alpha:]][$_[:alnum:]]*\\\\s*=>)))|((async\\\\s*)?(((<\\\\s*)$|(\\\\(\\\\s*((([\\\\[{]\\\\s*)?)$|((\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})\\\\s*((:\\\\s*\\\\{?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*)))|((\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])\\\\s*((:\\\\s*\\\\[?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*))))))|((<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*)?\\\\(\\\\s*(/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*)*((\\\\)\\\\s*:)|((\\\\.\\\\.\\\\.\\\\s*)?[$_[:alpha:]][$_[:alnum:]]*\\\\s*:)))|(<\\\\s*[$_[:alpha:]][$_[:alnum:]]*\\\\s+extends\\\\s*[^=>])|((<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*)?\\\\(\\\\s*(/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*)*(([$_[:alpha:]]|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])|(\\\\.\\\\.\\\\.\\\\s*[$_[:alpha:]]))([^\\"\'()`]|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`))*)?\\\\)(\\\\s*:\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+)?\\\\s*=>)))))","name":"meta.object.member.js"},{"captures":{"0":{"name":"meta.object-literal.key.js"}},"match":"[$_[:alpha:]][$_[:alnum:]]*\\\\s*(?=(/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*)*:)","name":"meta.object.member.js"},{"begin":"\\\\.\\\\.\\\\.","beginCaptures":{"0":{"name":"keyword.operator.spread.js"}},"end":"(?=[,}])","name":"meta.object.member.js","patterns":[{"include":"#expression"}]},{"captures":{"1":{"name":"variable.other.readwrite.js"}},"match":"([$_[:alpha:]][$_[:alnum:]]*)\\\\s*(?=[,}]|$|//|/\\\\*)","name":"meta.object.member.js"},{"captures":{"1":{"name":"keyword.control.as.js"},"2":{"name":"storage.modifier.js"}},"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(as)\\\\s+(const)(?=\\\\s*([,}]|$))","name":"meta.object.member.js"},{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:(as)|(satisfies))\\\\s+","beginCaptures":{"1":{"name":"keyword.control.as.js"},"2":{"name":"keyword.control.satisfies.js"}},"end":"(?=[-\\\\])+,:;>?}]|\\\\|\\\\||&&|!==|$|^|((?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(as|satisifies)\\\\s+))","name":"meta.object.member.js","patterns":[{"include":"#type"}]},{"begin":"(?=[$_[:alpha:]][$_[:alnum:]]*\\\\s*=)","end":"(?=[,}]|$|//|/\\\\*)","name":"meta.object.member.js","patterns":[{"include":"#expression"}]},{"begin":":","beginCaptures":{"0":{"name":"meta.object-literal.key.js punctuation.separator.key-value.js"}},"end":"(?=[,}])","name":"meta.object.member.js","patterns":[{"begin":"(?<=:)\\\\s*(async)?(?=\\\\s*(<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*)\\\\(\\\\s*((([\\\\[{]\\\\s*)?)$|((\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})\\\\s*((:\\\\s*\\\\{?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*)))|((\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])\\\\s*((:\\\\s*\\\\[?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*)))))","beginCaptures":{"1":{"name":"storage.modifier.async.js"}},"end":"(?<=\\\\))","patterns":[{"include":"#type-parameters"},{"begin":"\\\\(","beginCaptures":{"0":{"name":"meta.brace.round.js"}},"end":"\\\\)","endCaptures":{"0":{"name":"meta.brace.round.js"}},"patterns":[{"include":"#expression-inside-possibly-arrow-parens"}]}]},{"begin":"(?<=:)\\\\s*(async)?\\\\s*(\\\\()(?=\\\\s*((([\\\\[{]\\\\s*)?)$|((\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})\\\\s*((:\\\\s*\\\\{?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*)))|((\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])\\\\s*((:\\\\s*\\\\[?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*)))))","beginCaptures":{"1":{"name":"storage.modifier.async.js"},"2":{"name":"meta.brace.round.js"}},"end":"\\\\)","endCaptures":{"0":{"name":"meta.brace.round.js"}},"patterns":[{"include":"#expression-inside-possibly-arrow-parens"}]},{"begin":"(?<=:)\\\\s*(async)?\\\\s*(?=<\\\\s*$)","beginCaptures":{"1":{"name":"storage.modifier.async.js"}},"end":"(?<=>)","patterns":[{"include":"#type-parameters"}]},{"begin":"(?<=>)\\\\s*(\\\\()(?=\\\\s*((([\\\\[{]\\\\s*)?)$|((\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})\\\\s*((:\\\\s*\\\\{?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*)))|((\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])\\\\s*((:\\\\s*\\\\[?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*)))))","beginCaptures":{"1":{"name":"meta.brace.round.js"}},"end":"\\\\)","endCaptures":{"0":{"name":"meta.brace.round.js"}},"patterns":[{"include":"#expression-inside-possibly-arrow-parens"}]},{"include":"#possibly-arrow-return-type"},{"include":"#expression"}]},{"include":"#punctuation-comma"},{"include":"#decl-block"}]},"parameter-array-binding-pattern":{"begin":"(?:(\\\\.\\\\.\\\\.)\\\\s*)?(\\\\[)","beginCaptures":{"1":{"name":"keyword.operator.rest.js"},"2":{"name":"punctuation.definition.binding-pattern.array.js"}},"end":"]","endCaptures":{"0":{"name":"punctuation.definition.binding-pattern.array.js"}},"patterns":[{"include":"#parameter-binding-element"},{"include":"#punctuation-comma"}]},"parameter-binding-element":{"patterns":[{"include":"#comment"},{"include":"#string"},{"include":"#numeric-literal"},{"include":"#regex"},{"include":"#parameter-object-binding-pattern"},{"include":"#parameter-array-binding-pattern"},{"include":"#destructuring-parameter-rest"},{"include":"#variable-initializer"}]},"parameter-name":{"patterns":[{"captures":{"1":{"name":"storage.modifier.js"}},"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(override|public|protected|private|readonly)\\\\s+(?=(override|public|protected|private|readonly)\\\\s+)"},{"captures":{"1":{"name":"storage.modifier.js"},"2":{"name":"keyword.operator.rest.js"},"3":{"name":"entity.name.function.js variable.language.this.js"},"4":{"name":"entity.name.function.js"},"5":{"name":"keyword.operator.optional.js"}},"match":"(?:(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(override|public|private|protected|readonly)\\\\s+)?(?:(\\\\.\\\\.\\\\.)\\\\s*)?(?<![:=])(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:(this)|([$_[:alpha:]][$_[:alnum:]]*))(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))\\\\s*(\\\\??)(?=\\\\s*(=\\\\s*(((async\\\\s+)?((function\\\\s*[(*<])|(function\\\\s+)|([$_[:alpha:]][$_[:alnum:]]*\\\\s*=>)))|((async\\\\s*)?(((<\\\\s*)$|(\\\\(\\\\s*((([\\\\[{]\\\\s*)?)$|((\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})\\\\s*((:\\\\s*\\\\{?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*)))|((\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])\\\\s*((:\\\\s*\\\\[?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*))))))|((<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*)?\\\\(\\\\s*(/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*)*((\\\\)\\\\s*:)|((\\\\.\\\\.\\\\.\\\\s*)?[$_[:alpha:]][$_[:alnum:]]*\\\\s*:)))|(<\\\\s*[$_[:alpha:]][$_[:alnum:]]*\\\\s+extends\\\\s*[^=>])|((<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*)?\\\\(\\\\s*(/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*)*(([$_[:alpha:]]|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])|(\\\\.\\\\.\\\\.\\\\s*[$_[:alpha:]]))([^\\"\'()`]|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`))*)?\\\\)(\\\\s*:\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+)?\\\\s*=>)))))|(:\\\\s*((<)|(\\\\(\\\\s*((\\\\))|(\\\\.\\\\.\\\\.)|([$_[:alnum:]]+\\\\s*(([,:=?])|(\\\\)\\\\s*=>)))))))|(:\\\\s*(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))Function(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.)))|(:\\\\s*((<\\\\s*)$|(\\\\(\\\\s*((([\\\\[{]\\\\s*)?)$|((\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})\\\\s*((:\\\\s*\\\\{?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*)))|((\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])\\\\s*((:\\\\s*\\\\[?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*)))))))|(:\\\\s*(=>|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(<[^<>]*>)|[^(),<=>])+=\\\\s*(((async\\\\s+)?((function\\\\s*[(*<])|(function\\\\s+)|([$_[:alpha:]][$_[:alnum:]]*\\\\s*=>)))|((async\\\\s*)?(((<\\\\s*)$|(\\\\(\\\\s*((([\\\\[{]\\\\s*)?)$|((\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})\\\\s*((:\\\\s*\\\\{?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*)))|((\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])\\\\s*((:\\\\s*\\\\[?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*))))))|((<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*)?\\\\(\\\\s*(/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*)*((\\\\)\\\\s*:)|((\\\\.\\\\.\\\\.\\\\s*)?[$_[:alpha:]][$_[:alnum:]]*\\\\s*:)))|(<\\\\s*[$_[:alpha:]][$_[:alnum:]]*\\\\s+extends\\\\s*[^=>])|((<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*)?\\\\(\\\\s*(/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*)*(([$_[:alpha:]]|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])|(\\\\.\\\\.\\\\.\\\\s*[$_[:alpha:]]))([^\\"\'()`]|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`))*)?\\\\)(\\\\s*:\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+)?\\\\s*=>))))))"},{"captures":{"1":{"name":"storage.modifier.js"},"2":{"name":"keyword.operator.rest.js"},"3":{"name":"variable.parameter.js variable.language.this.js"},"4":{"name":"variable.parameter.js"},"5":{"name":"keyword.operator.optional.js"}},"match":"(?:(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(override|public|private|protected|readonly)\\\\s+)?(?:(\\\\.\\\\.\\\\.)\\\\s*)?(?<![:=])(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:(this)|([$_[:alpha:]][$_[:alnum:]]*))(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))\\\\s*(\\\\??)"}]},"parameter-object-binding-element":{"patterns":[{"include":"#comment"},{"begin":"(?=(\\\\b((?<!\\\\$)0[Xx]\\\\h[_\\\\h]*(n)?\\\\b(?!\\\\$))|\\\\b((?<!\\\\$)0[Bb][01][01_]*(n)?\\\\b(?!\\\\$))|\\\\b((?<!\\\\$)0[Oo]?[0-7][0-7_]*(n)?\\\\b(?!\\\\$))|((?<!\\\\$)(?:\\\\b[0-9][0-9_]*(\\\\.)[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\B(\\\\.)[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*[Ee][-+]?[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(\\\\.)(n)?\\\\B|\\\\B(\\\\.)[0-9][0-9_]*(n)?\\\\b|\\\\b[0-9][0-9_]*(n)?\\\\b(?!\\\\.))(?!\\\\$))|([$_[:alpha:]][$_[:alnum:]]*)|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`)|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])+]))\\\\s*(:))","end":"(?=[,}])","patterns":[{"include":"#object-binding-element-propertyName"},{"include":"#parameter-binding-element"},{"include":"#paren-expression"}]},{"include":"#parameter-object-binding-pattern"},{"include":"#destructuring-parameter-rest"},{"include":"#variable-initializer"},{"include":"#punctuation-comma"}]},"parameter-object-binding-pattern":{"begin":"(?:(\\\\.\\\\.\\\\.)\\\\s*)?(\\\\{)","beginCaptures":{"1":{"name":"keyword.operator.rest.js"},"2":{"name":"punctuation.definition.binding-pattern.object.js"}},"end":"}","endCaptures":{"0":{"name":"punctuation.definition.binding-pattern.object.js"}},"patterns":[{"include":"#parameter-object-binding-element"}]},"parameter-type-annotation":{"patterns":[{"begin":"(:)","beginCaptures":{"1":{"name":"keyword.operator.type.annotation.js"}},"end":"(?=[),])|(?==[^>])","name":"meta.type.annotation.js","patterns":[{"include":"#type"}]}]},"paren-expression":{"begin":"\\\\(","beginCaptures":{"0":{"name":"meta.brace.round.js"}},"end":"\\\\)","endCaptures":{"0":{"name":"meta.brace.round.js"}},"patterns":[{"include":"#expression"}]},"paren-expression-possibly-arrow":{"patterns":[{"begin":"(?<=[(,=])\\\\s*(async)?(?=\\\\s*((<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*))?\\\\(\\\\s*((([\\\\[{]\\\\s*)?)$|((\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})\\\\s*((:\\\\s*\\\\{?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*)))|((\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])\\\\s*((:\\\\s*\\\\[?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*)))))","beginCaptures":{"1":{"name":"storage.modifier.async.js"}},"end":"(?<=\\\\))","patterns":[{"include":"#paren-expression-possibly-arrow-with-typeparameters"}]},{"begin":"(?<=[(,=]|=>|^return|[^$._[:alnum:]]return)\\\\s*(async)?(?=\\\\s*((((<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*))?\\\\()|(<)|((<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*)))\\\\s*$)","beginCaptures":{"1":{"name":"storage.modifier.async.js"}},"end":"(?<=\\\\))","patterns":[{"include":"#paren-expression-possibly-arrow-with-typeparameters"}]},{"include":"#possibly-arrow-return-type"}]},"paren-expression-possibly-arrow-with-typeparameters":{"patterns":[{"include":"#type-parameters"},{"begin":"\\\\(","beginCaptures":{"0":{"name":"meta.brace.round.js"}},"end":"\\\\)","endCaptures":{"0":{"name":"meta.brace.round.js"}},"patterns":[{"include":"#expression-inside-possibly-arrow-parens"}]}]},"possibly-arrow-return-type":{"begin":"(?<=\\\\)|^)\\\\s*(:)(?=\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*=>)","beginCaptures":{"1":{"name":"meta.arrow.js meta.return.type.arrow.js keyword.operator.type.annotation.js"}},"contentName":"meta.arrow.js meta.return.type.arrow.js","end":"(?==>|\\\\{|^(\\\\s*(export|function|class|interface|let|var|\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b|\\\\bawait\\\\s+\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b\\\\b|const|import|enum|namespace|module|type|abstract|declare)\\\\s+))","patterns":[{"include":"#arrow-return-type-body"}]},"property-accessor":{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(accessor|get|set)(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","name":"storage.type.property.js"},"punctuation-accessor":{"captures":{"1":{"name":"punctuation.accessor.js"},"2":{"name":"punctuation.accessor.optional.js"}},"match":"(\\\\.)|(\\\\?\\\\.(?!\\\\s*\\\\d))"},"punctuation-comma":{"match":",","name":"punctuation.separator.comma.js"},"punctuation-semicolon":{"match":";","name":"punctuation.terminator.statement.js"},"qstring-double":{"begin":"\\"","beginCaptures":{"0":{"name":"punctuation.definition.string.begin.js"}},"end":"(\\")|([^\\\\n\\\\\\\\])$","endCaptures":{"1":{"name":"punctuation.definition.string.end.js"},"2":{"name":"invalid.illegal.newline.js"}},"name":"string.quoted.double.js","patterns":[{"include":"#string-character-escape"}]},"qstring-single":{"begin":"\'","beginCaptures":{"0":{"name":"punctuation.definition.string.begin.js"}},"end":"(\')|([^\\\\n\\\\\\\\])$","endCaptures":{"1":{"name":"punctuation.definition.string.end.js"},"2":{"name":"invalid.illegal.newline.js"}},"name":"string.quoted.single.js","patterns":[{"include":"#string-character-escape"}]},"regex":{"patterns":[{"begin":"(?<!\\\\+\\\\+|--|})(?<=[!(+,:=?\\\\[]|^return|[^$._[:alnum:]]return|^case|[^$._[:alnum:]]case|=>|&&|\\\\|\\\\||\\\\*/)\\\\s*(/)(?![*/])(?=(?:[^()/\\\\[\\\\\\\\]|\\\\\\\\.|\\\\[([^]\\\\\\\\]|\\\\\\\\.)+]|\\\\(([^)\\\\\\\\]|\\\\\\\\.)+\\\\))+/([dgimsuvy]+|(?![*/])|(?=/\\\\*))(?!\\\\s*[$0-9A-Z_a-z]))","beginCaptures":{"1":{"name":"punctuation.definition.string.begin.js"}},"end":"(/)([dgimsuvy]*)","endCaptures":{"1":{"name":"punctuation.definition.string.end.js"},"2":{"name":"keyword.other.js"}},"name":"string.regexp.js","patterns":[{"include":"#regexp"}]},{"begin":"((?<![]$)_[:alnum:]]|\\\\+\\\\+|--|}|\\\\*/)|((?<=^return|[^$._[:alnum:]]return|^case|[^$._[:alnum:]]case))\\\\s*)/(?![*/])(?=(?:[^/\\\\[\\\\\\\\]|\\\\\\\\.|\\\\[([^]\\\\\\\\]|\\\\\\\\.)*])+/([dgimsuvy]+|(?![*/])|(?=/\\\\*))(?!\\\\s*[$0-9A-Z_a-z]))","beginCaptures":{"0":{"name":"punctuation.definition.string.begin.js"}},"end":"(/)([dgimsuvy]*)","endCaptures":{"1":{"name":"punctuation.definition.string.end.js"},"2":{"name":"keyword.other.js"}},"name":"string.regexp.js","patterns":[{"include":"#regexp"}]}]},"regex-character-class":{"patterns":[{"match":"\\\\\\\\[DSWdfnrstvw]|\\\\.","name":"constant.other.character-class.regexp"},{"match":"\\\\\\\\([0-7]{3}|x\\\\h{2}|u\\\\h{4})","name":"constant.character.numeric.regexp"},{"match":"\\\\\\\\c[A-Z]","name":"constant.character.control.regexp"},{"match":"\\\\\\\\.","name":"constant.character.escape.backslash.regexp"}]},"regexp":{"patterns":[{"match":"\\\\\\\\[Bb]|[$^]","name":"keyword.control.anchor.regexp"},{"captures":{"0":{"name":"keyword.other.back-reference.regexp"},"1":{"name":"variable.other.regexp"}},"match":"\\\\\\\\(?:[1-9]\\\\d*|k<([$A-Z_a-z][$\\\\w]*)>)"},{"match":"[*+?]|\\\\{(\\\\d+,\\\\d+|\\\\d+,|,\\\\d+|\\\\d+)}\\\\??","name":"keyword.operator.quantifier.regexp"},{"match":"\\\\|","name":"keyword.operator.or.regexp"},{"begin":"(\\\\()((\\\\?=)|(\\\\?!)|(\\\\?<=)|(\\\\?<!))","beginCaptures":{"1":{"name":"punctuation.definition.group.regexp"},"2":{"name":"punctuation.definition.group.assertion.regexp"},"3":{"name":"meta.assertion.look-ahead.regexp"},"4":{"name":"meta.assertion.negative-look-ahead.regexp"},"5":{"name":"meta.assertion.look-behind.regexp"},"6":{"name":"meta.assertion.negative-look-behind.regexp"}},"end":"(\\\\))","endCaptures":{"1":{"name":"punctuation.definition.group.regexp"}},"name":"meta.group.assertion.regexp","patterns":[{"include":"#regexp"}]},{"begin":"\\\\((?:(\\\\?:)|\\\\?<([$A-Z_a-z][$\\\\w]*)>)?","beginCaptures":{"0":{"name":"punctuation.definition.group.regexp"},"1":{"name":"punctuation.definition.group.no-capture.regexp"},"2":{"name":"variable.other.regexp"}},"end":"\\\\)","endCaptures":{"0":{"name":"punctuation.definition.group.regexp"}},"name":"meta.group.regexp","patterns":[{"include":"#regexp"}]},{"begin":"(\\\\[)(\\\\^)?","beginCaptures":{"1":{"name":"punctuation.definition.character-class.regexp"},"2":{"name":"keyword.operator.negation.regexp"}},"end":"(])","endCaptures":{"1":{"name":"punctuation.definition.character-class.regexp"}},"name":"constant.other.character-class.set.regexp","patterns":[{"captures":{"1":{"name":"constant.character.numeric.regexp"},"2":{"name":"constant.character.control.regexp"},"3":{"name":"constant.character.escape.backslash.regexp"},"4":{"name":"constant.character.numeric.regexp"},"5":{"name":"constant.character.control.regexp"},"6":{"name":"constant.character.escape.backslash.regexp"}},"match":"(?:.|(\\\\\\\\(?:[0-7]{3}|x\\\\h{2}|u\\\\h{4}))|(\\\\\\\\c[A-Z])|(\\\\\\\\.))-(?:[^]\\\\\\\\]|(\\\\\\\\(?:[0-7]{3}|x\\\\h{2}|u\\\\h{4}))|(\\\\\\\\c[A-Z])|(\\\\\\\\.))","name":"constant.other.character-class.range.regexp"},{"include":"#regex-character-class"}]},{"include":"#regex-character-class"}]},"return-type":{"patterns":[{"begin":"(?<=\\\\))\\\\s*(:)(?=\\\\s*\\\\S)","beginCaptures":{"1":{"name":"keyword.operator.type.annotation.js"}},"end":"(?<![\\\\&:|])(?=$|^|[,;{}]|//)","name":"meta.return.type.js","patterns":[{"include":"#return-type-core"}]},{"begin":"(?<=\\\\))\\\\s*(:)","beginCaptures":{"1":{"name":"keyword.operator.type.annotation.js"}},"end":"(?<![\\\\&:|])((?=[,;{}]|//|^\\\\s*$)|((?<=\\\\S)(?=\\\\s*$)))","name":"meta.return.type.js","patterns":[{"include":"#return-type-core"}]}]},"return-type-core":{"patterns":[{"include":"#comment"},{"begin":"(?<=[\\\\&:|])(?=\\\\s*\\\\{)","end":"(?<=})","patterns":[{"include":"#type-object"}]},{"include":"#type-predicate-operator"},{"include":"#type"}]},"shebang":{"captures":{"1":{"name":"punctuation.definition.comment.js"}},"match":"\\\\A(#!).*(?=$)","name":"comment.line.shebang.js"},"single-line-comment-consuming-line-ending":{"begin":"(^[\\\\t ]+)?((//)(?:\\\\s*((@)internal)(?=\\\\s|$))?)","beginCaptures":{"1":{"name":"punctuation.whitespace.comment.leading.js"},"2":{"name":"comment.line.double-slash.js"},"3":{"name":"punctuation.definition.comment.js"},"4":{"name":"storage.type.internaldeclaration.js"},"5":{"name":"punctuation.decorator.internaldeclaration.js"}},"contentName":"comment.line.double-slash.js","end":"(?=^)"},"statements":{"patterns":[{"include":"#declaration"},{"include":"#control-statement"},{"include":"#after-operator-block-as-object-literal"},{"include":"#decl-block"},{"include":"#label"},{"include":"#expression"},{"include":"#punctuation-semicolon"},{"include":"#string"},{"include":"#comment"}]},"string":{"patterns":[{"include":"#qstring-single"},{"include":"#qstring-double"},{"include":"#template"}]},"string-character-escape":{"match":"\\\\\\\\(x\\\\h{2}|u\\\\h{4}|u\\\\{\\\\h+}|[012][0-7]{0,2}|3[0-6][0-7]?|37[0-7]?|[4-7][0-7]?|.|$)","name":"constant.character.escape.js"},"super-literal":{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))super\\\\b(?!\\\\$)","name":"variable.language.super.js"},"support-function-call-identifiers":{"patterns":[{"include":"#literal"},{"include":"#support-objects"},{"include":"#object-identifiers"},{"include":"#punctuation-accessor"},{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))import(?=\\\\s*\\\\(\\\\s*[\\"\'`])","name":"keyword.operator.expression.import.js"}]},"support-objects":{"patterns":[{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(arguments)\\\\b(?!\\\\$)","name":"variable.language.arguments.js"},{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(Promise)\\\\b(?!\\\\$)","name":"support.class.promise.js"},{"captures":{"1":{"name":"keyword.control.import.js"},"2":{"name":"punctuation.accessor.js"},"3":{"name":"punctuation.accessor.optional.js"},"4":{"name":"support.variable.property.importmeta.js"}},"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(import)\\\\s*(?:(\\\\.)|(\\\\?\\\\.(?!\\\\s*\\\\d)))\\\\s*(meta)\\\\b(?!\\\\$)"},{"captures":{"1":{"name":"keyword.operator.new.js"},"2":{"name":"punctuation.accessor.js"},"3":{"name":"punctuation.accessor.optional.js"},"4":{"name":"support.variable.property.target.js"}},"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(new)\\\\s*(?:(\\\\.)|(\\\\?\\\\.(?!\\\\s*\\\\d)))\\\\s*(target)\\\\b(?!\\\\$)"},{"captures":{"1":{"name":"punctuation.accessor.js"},"2":{"name":"punctuation.accessor.optional.js"},"3":{"name":"support.variable.property.js"},"4":{"name":"support.constant.js"}},"match":"(?:(\\\\.)|(\\\\?\\\\.(?!\\\\s*\\\\d)))\\\\s*(?:(constructor|length|prototype|__proto__)\\\\b(?!\\\\$|\\\\s*(<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*)?\\\\()|(EPSILON|MAX_SAFE_INTEGER|MAX_VALUE|MIN_SAFE_INTEGER|MIN_VALUE|NEGATIVE_INFINITY|POSITIVE_INFINITY)\\\\b(?!\\\\$))"},{"captures":{"1":{"name":"support.type.object.module.js"},"2":{"name":"support.type.object.module.js"},"3":{"name":"punctuation.accessor.js"},"4":{"name":"punctuation.accessor.optional.js"},"5":{"name":"support.type.object.module.js"}},"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:(exports)|(module)(?:(?:(\\\\.)|(\\\\?\\\\.(?!\\\\s*\\\\d)))(exports|id|filename|loaded|parent|children))?)\\\\b(?!\\\\$)"}]},"switch-statement":{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?=\\\\bswitch\\\\s*\\\\()","end":"}","endCaptures":{"0":{"name":"punctuation.definition.block.js"}},"name":"switch-statement.expr.js","patterns":[{"include":"#comment"},{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(switch)\\\\s*(\\\\()","beginCaptures":{"1":{"name":"keyword.control.switch.js"},"2":{"name":"meta.brace.round.js"}},"end":"\\\\)","endCaptures":{"0":{"name":"meta.brace.round.js"}},"name":"switch-expression.expr.js","patterns":[{"include":"#expression"}]},{"begin":"\\\\{","beginCaptures":{"0":{"name":"punctuation.definition.block.js"}},"end":"(?=})","name":"switch-block.expr.js","patterns":[{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(case|default(?=:))(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","beginCaptures":{"1":{"name":"keyword.control.switch.js"}},"end":"(?=:)","name":"case-clause.expr.js","patterns":[{"include":"#expression"}]},{"begin":"(:)\\\\s*(\\\\{)","beginCaptures":{"1":{"name":"case-clause.expr.js punctuation.definition.section.case-statement.js"},"2":{"name":"meta.block.js punctuation.definition.block.js"}},"contentName":"meta.block.js","end":"}","endCaptures":{"0":{"name":"meta.block.js punctuation.definition.block.js"}},"patterns":[{"include":"#statements"}]},{"captures":{"0":{"name":"case-clause.expr.js punctuation.definition.section.case-statement.js"}},"match":"(:)"},{"include":"#statements"}]}]},"template":{"patterns":[{"include":"#template-call"},{"begin":"([$_[:alpha:]][$_[:alnum:]]*)?(`)","beginCaptures":{"1":{"name":"entity.name.function.tagged-template.js"},"2":{"name":"string.template.js punctuation.definition.string.template.begin.js"}},"contentName":"string.template.js","end":"`","endCaptures":{"0":{"name":"string.template.js punctuation.definition.string.template.end.js"}},"patterns":[{"include":"#template-substitution-element"},{"include":"#string-character-escape"}]}]},"template-call":{"patterns":[{"begin":"(?=(([$_[:alpha:]][$_[:alnum:]]*\\\\s*\\\\??\\\\.\\\\s*)*|(\\\\??\\\\.\\\\s*)?)([$_[:alpha:]][$_[:alnum:]]*)(<\\\\s*(((keyof|infer|typeof|readonly)\\\\s+)|(([$_[:alpha:]][$_[:alnum:]]*|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`))(?=\\\\s*([,.<>\\\\[]|=>|&(?!&)|\\\\|(?!\\\\|)))))([^(<>]|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(?<==)>|<\\\\s*(((keyof|infer|typeof|readonly)\\\\s+)|(([$_[:alpha:]][$_[:alnum:]]*|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`))(?=\\\\s*([,.<>\\\\[]|=>|&(?!&)|\\\\|(?!\\\\|)))))(([^(<>]|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(?<==)>|<\\\\s*(((keyof|infer|typeof|readonly)\\\\s+)|(([$_[:alpha:]][$_[:alnum:]]*|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`))(?=\\\\s*([,.<>\\\\[]|=>|&(?!&)|\\\\|(?!\\\\|)))))([^(<>]|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(?<==)>)*(?<!=)>))*(?<!=)>)*(?<!=)>\\\\s*)?`)","end":"(?=`)","patterns":[{"begin":"(?=(([$_[:alpha:]][$_[:alnum:]]*\\\\s*\\\\??\\\\.\\\\s*)*|(\\\\??\\\\.\\\\s*)?)([$_[:alpha:]][$_[:alnum:]]*))","end":"(?=(<\\\\s*(((keyof|infer|typeof|readonly)\\\\s+)|(([$_[:alpha:]][$_[:alnum:]]*|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`))(?=\\\\s*([,.<>\\\\[]|=>|&(?!&)|\\\\|(?!\\\\|)))))([^(<>]|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(?<==)>|<\\\\s*(((keyof|infer|typeof|readonly)\\\\s+)|(([$_[:alpha:]][$_[:alnum:]]*|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`))(?=\\\\s*([,.<>\\\\[]|=>|&(?!&)|\\\\|(?!\\\\|)))))(([^(<>]|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(?<==)>|<\\\\s*(((keyof|infer|typeof|readonly)\\\\s+)|(([$_[:alpha:]][$_[:alnum:]]*|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`))(?=\\\\s*([,.<>\\\\[]|=>|&(?!&)|\\\\|(?!\\\\|)))))([^(<>]|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(?<==)>)*(?<!=)>))*(?<!=)>)*(?<!=)>\\\\s*)?`)","patterns":[{"include":"#support-function-call-identifiers"},{"match":"([$_[:alpha:]][$_[:alnum:]]*)","name":"entity.name.function.tagged-template.js"}]},{"include":"#type-arguments"}]},{"begin":"([$_[:alpha:]][$_[:alnum:]]*)?\\\\s*(?=(<\\\\s*(((keyof|infer|typeof|readonly)\\\\s+)|(([$_[:alpha:]][$_[:alnum:]]*|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`))(?=\\\\s*([,.<>\\\\[]|=>|&(?!&)|\\\\|(?!\\\\|)))))([^(<>]|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(?<==)>|<\\\\s*(((keyof|infer|typeof|readonly)\\\\s+)|(([$_[:alpha:]][$_[:alnum:]]*|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`))(?=\\\\s*([,.<>\\\\[]|=>|&(?!&)|\\\\|(?!\\\\|)))))(([^(<>]|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(?<==)>|<\\\\s*(((keyof|infer|typeof|readonly)\\\\s+)|(([$_[:alpha:]][$_[:alnum:]]*|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`))(?=\\\\s*([,.<>\\\\[]|=>|&(?!&)|\\\\|(?!\\\\|)))))([^(<>]|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(?<==)>)*(?<!=)>))*(?<!=)>)*(?<!=)>\\\\s*)`)","beginCaptures":{"1":{"name":"entity.name.function.tagged-template.js"}},"end":"(?=`)","patterns":[{"include":"#type-arguments"}]}]},"template-substitution-element":{"begin":"\\\\$\\\\{","beginCaptures":{"0":{"name":"punctuation.definition.template-expression.begin.js"}},"contentName":"meta.embedded.line.js","end":"}","endCaptures":{"0":{"name":"punctuation.definition.template-expression.end.js"}},"name":"meta.template.expression.js","patterns":[{"include":"#expression"}]},"template-type":{"patterns":[{"include":"#template-call"},{"begin":"([$_[:alpha:]][$_[:alnum:]]*)?(`)","beginCaptures":{"1":{"name":"entity.name.function.tagged-template.js"},"2":{"name":"string.template.js punctuation.definition.string.template.begin.js"}},"contentName":"string.template.js","end":"`","endCaptures":{"0":{"name":"string.template.js punctuation.definition.string.template.end.js"}},"patterns":[{"include":"#template-type-substitution-element"},{"include":"#string-character-escape"}]}]},"template-type-substitution-element":{"begin":"\\\\$\\\\{","beginCaptures":{"0":{"name":"punctuation.definition.template-expression.begin.js"}},"contentName":"meta.embedded.line.js","end":"}","endCaptures":{"0":{"name":"punctuation.definition.template-expression.end.js"}},"name":"meta.template.expression.js","patterns":[{"include":"#type"}]},"ternary-expression":{"begin":"(?!\\\\?\\\\.\\\\s*\\\\D)(\\\\?)(?!\\\\?)","beginCaptures":{"1":{"name":"keyword.operator.ternary.js"}},"end":"\\\\s*(:)","endCaptures":{"1":{"name":"keyword.operator.ternary.js"}},"patterns":[{"include":"#expression"}]},"this-literal":{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))this\\\\b(?!\\\\$)","name":"variable.language.this.js"},"type":{"patterns":[{"include":"#comment"},{"include":"#type-string"},{"include":"#numeric-literal"},{"include":"#type-primitive"},{"include":"#type-builtin-literals"},{"include":"#type-parameters"},{"include":"#type-tuple"},{"include":"#type-object"},{"include":"#type-operators"},{"include":"#type-conditional"},{"include":"#type-fn-type-parameters"},{"include":"#type-paren-or-function-parameters"},{"include":"#type-function-return-type"},{"captures":{"1":{"name":"storage.modifier.js"}},"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(readonly)(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))\\\\s*"},{"include":"#type-name"}]},"type-alias-declaration":{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:\\\\b(export)\\\\s+)?(?:\\\\b(declare)\\\\s+)?\\\\b(type)\\\\b\\\\s+([$_[:alpha:]][$_[:alnum:]]*)\\\\s*","beginCaptures":{"1":{"name":"keyword.control.export.js"},"2":{"name":"storage.modifier.js"},"3":{"name":"storage.type.type.js"},"4":{"name":"entity.name.type.alias.js"}},"end":"(?=[;}]|^\\\\s*$|^\\\\s*(?:abstract|async|\\\\bawait\\\\s+\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b\\\\b|break|case|catch|class|const|continue|declare|do|else|enum|export|finally|function|for|goto|if|import|interface|let|module|namespace|switch|return|throw|try|type|\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b|var|while)\\\\b)","name":"meta.type.declaration.js","patterns":[{"include":"#comment"},{"include":"#type-parameters"},{"begin":"(=)\\\\s*(intrinsic)(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","beginCaptures":{"1":{"name":"keyword.operator.assignment.js"},"2":{"name":"keyword.control.intrinsic.js"}},"end":"(?=[;}]|^\\\\s*$|^\\\\s*(?:abstract|async|\\\\bawait\\\\s+\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b\\\\b|break|case|catch|class|const|continue|declare|do|else|enum|export|finally|function|for|goto|if|import|interface|let|module|namespace|switch|return|throw|try|type|\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b|var|while)\\\\b)","patterns":[{"include":"#type"}]},{"begin":"(=)\\\\s*","beginCaptures":{"1":{"name":"keyword.operator.assignment.js"}},"end":"(?=[;}]|^\\\\s*$|^\\\\s*(?:abstract|async|\\\\bawait\\\\s+\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b\\\\b|break|case|catch|class|const|continue|declare|do|else|enum|export|finally|function|for|goto|if|import|interface|let|module|namespace|switch|return|throw|try|type|\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b|var|while)\\\\b)","patterns":[{"include":"#type"}]}]},"type-annotation":{"patterns":[{"begin":"(:)(?=\\\\s*\\\\S)","beginCaptures":{"1":{"name":"keyword.operator.type.annotation.js"}},"end":"(?<![\\\\&:|])(?!\\\\s*[\\\\&|]\\\\s+)((?=^|[]),;}]|//)|(?==[^>])|((?<=[]$)>_}[:alpha:]])\\\\s*(?=\\\\{)))","name":"meta.type.annotation.js","patterns":[{"include":"#type"}]},{"begin":"(:)","beginCaptures":{"1":{"name":"keyword.operator.type.annotation.js"}},"end":"(?<![\\\\&:|])((?=[]),;}]|//)|(?==[^>])|(?=^\\\\s*$)|((?<=[]$)>_}[:alpha:]])\\\\s*(?=\\\\{)))","name":"meta.type.annotation.js","patterns":[{"include":"#type"}]}]},"type-arguments":{"begin":"<","beginCaptures":{"0":{"name":"punctuation.definition.typeparameters.begin.js"}},"end":">","endCaptures":{"0":{"name":"punctuation.definition.typeparameters.end.js"}},"name":"meta.type.parameters.js","patterns":[{"include":"#type-arguments-body"}]},"type-arguments-body":{"patterns":[{"captures":{"0":{"name":"keyword.operator.type.js"}},"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(_)(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))"},{"include":"#type"},{"include":"#punctuation-comma"}]},"type-builtin-literals":{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(this|true|false|undefined|null|object)(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","name":"support.type.builtin.js"},"type-conditional":{"patterns":[{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(extends)\\\\s+","beginCaptures":{"1":{"name":"storage.modifier.js"}},"end":"(?<=:)","patterns":[{"begin":"\\\\?","beginCaptures":{"0":{"name":"keyword.operator.ternary.js"}},"end":":","endCaptures":{"0":{"name":"keyword.operator.ternary.js"}},"patterns":[{"include":"#type"}]},{"include":"#type"}]}]},"type-fn-type-parameters":{"patterns":[{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:(abstract)\\\\s+)?(new)\\\\b(?=\\\\s*<)","beginCaptures":{"1":{"name":"meta.type.constructor.js storage.modifier.js"},"2":{"name":"meta.type.constructor.js keyword.control.new.js"}},"end":"(?<=>)","patterns":[{"include":"#comment"},{"include":"#type-parameters"}]},{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:(abstract)\\\\s+)?(new)\\\\b\\\\s*(?=\\\\()","beginCaptures":{"1":{"name":"storage.modifier.js"},"2":{"name":"keyword.control.new.js"}},"end":"(?<=\\\\))","name":"meta.type.constructor.js","patterns":[{"include":"#function-parameters"}]},{"begin":"((?=\\\\(\\\\s*((\\\\))|(\\\\.\\\\.\\\\.)|([$_[:alnum:]]+\\\\s*(([,:=?])|(\\\\)\\\\s*=>))))))","end":"(?<=\\\\))","name":"meta.type.function.js","patterns":[{"include":"#function-parameters"}]}]},"type-function-return-type":{"patterns":[{"begin":"(=>)(?=\\\\s*\\\\S)","beginCaptures":{"1":{"name":"storage.type.function.arrow.js"}},"end":"(?<!=>)(?<![\\\\&|])(?=[]),:;=>?{}]|//|$)","name":"meta.type.function.return.js","patterns":[{"include":"#type-function-return-type-core"}]},{"begin":"=>","beginCaptures":{"0":{"name":"storage.type.function.arrow.js"}},"end":"(?<!=>)(?<![\\\\&|])((?=[]),:;=>?{}]|//|^\\\\s*$)|((?<=\\\\S)(?=\\\\s*$)))","name":"meta.type.function.return.js","patterns":[{"include":"#type-function-return-type-core"}]}]},"type-function-return-type-core":{"patterns":[{"include":"#comment"},{"begin":"(?<==>)(?=\\\\s*\\\\{)","end":"(?<=})","patterns":[{"include":"#type-object"}]},{"include":"#type-predicate-operator"},{"include":"#type"}]},"type-infer":{"patterns":[{"captures":{"1":{"name":"keyword.operator.expression.infer.js"},"2":{"name":"entity.name.type.js"},"3":{"name":"keyword.operator.expression.extends.js"}},"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(infer)\\\\s+([$_[:alpha:]][$_[:alnum:]]*)(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))(?:\\\\s+(extends)(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.)))?","name":"meta.type.infer.js"}]},"type-name":{"patterns":[{"begin":"([$_[:alpha:]][$_[:alnum:]]*)\\\\s*(?:(\\\\.)|(\\\\?\\\\.(?!\\\\s*\\\\d)))\\\\s*(<)","captures":{"1":{"name":"entity.name.type.module.js"},"2":{"name":"punctuation.accessor.js"},"3":{"name":"punctuation.accessor.optional.js"},"4":{"name":"meta.type.parameters.js punctuation.definition.typeparameters.begin.js"}},"contentName":"meta.type.parameters.js","end":"(>)","endCaptures":{"1":{"name":"meta.type.parameters.js punctuation.definition.typeparameters.end.js"}},"patterns":[{"include":"#type-arguments-body"}]},{"begin":"([$_[:alpha:]][$_[:alnum:]]*)\\\\s*(<)","beginCaptures":{"1":{"name":"entity.name.type.js"},"2":{"name":"meta.type.parameters.js punctuation.definition.typeparameters.begin.js"}},"contentName":"meta.type.parameters.js","end":"(>)","endCaptures":{"1":{"name":"meta.type.parameters.js punctuation.definition.typeparameters.end.js"}},"patterns":[{"include":"#type-arguments-body"}]},{"captures":{"1":{"name":"entity.name.type.module.js"},"2":{"name":"punctuation.accessor.js"},"3":{"name":"punctuation.accessor.optional.js"}},"match":"([$_[:alpha:]][$_[:alnum:]]*)\\\\s*(?:(\\\\.)|(\\\\?\\\\.(?!\\\\s*\\\\d)))"},{"match":"[$_[:alpha:]][$_[:alnum:]]*","name":"entity.name.type.js"}]},"type-object":{"begin":"\\\\{","beginCaptures":{"0":{"name":"punctuation.definition.block.js"}},"end":"}","endCaptures":{"0":{"name":"punctuation.definition.block.js"}},"name":"meta.object.type.js","patterns":[{"include":"#comment"},{"include":"#method-declaration"},{"include":"#indexer-declaration"},{"include":"#indexer-mapped-type-declaration"},{"include":"#field-declaration"},{"include":"#type-annotation"},{"begin":"\\\\.\\\\.\\\\.","beginCaptures":{"0":{"name":"keyword.operator.spread.js"}},"end":"(?=[,;}]|$)|(?<=})","patterns":[{"include":"#type"}]},{"include":"#punctuation-comma"},{"include":"#punctuation-semicolon"},{"include":"#type"}]},"type-operators":{"patterns":[{"include":"#typeof-operator"},{"include":"#type-infer"},{"begin":"([\\\\&|])(?=\\\\s*\\\\{)","beginCaptures":{"0":{"name":"keyword.operator.type.js"}},"end":"(?<=})","patterns":[{"include":"#type-object"}]},{"begin":"[\\\\&|]","beginCaptures":{"0":{"name":"keyword.operator.type.js"}},"end":"(?=\\\\S)"},{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))keyof(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","name":"keyword.operator.expression.keyof.js"},{"match":"([:?])","name":"keyword.operator.ternary.js"},{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))import(?=\\\\s*\\\\()","name":"keyword.operator.expression.import.js"}]},"type-parameters":{"begin":"(<)","beginCaptures":{"1":{"name":"punctuation.definition.typeparameters.begin.js"}},"end":"(>)","endCaptures":{"1":{"name":"punctuation.definition.typeparameters.end.js"}},"name":"meta.type.parameters.js","patterns":[{"include":"#comment"},{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(extends|in|out|const)(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","name":"storage.modifier.js"},{"include":"#type"},{"include":"#punctuation-comma"},{"match":"(=)(?!>)","name":"keyword.operator.assignment.js"}]},"type-paren-or-function-parameters":{"begin":"\\\\(","beginCaptures":{"0":{"name":"meta.brace.round.js"}},"end":"\\\\)","endCaptures":{"0":{"name":"meta.brace.round.js"}},"name":"meta.type.paren.cover.js","patterns":[{"captures":{"1":{"name":"storage.modifier.js"},"2":{"name":"keyword.operator.rest.js"},"3":{"name":"entity.name.function.js variable.language.this.js"},"4":{"name":"entity.name.function.js"},"5":{"name":"keyword.operator.optional.js"}},"match":"(?:(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(public|private|protected|readonly)\\\\s+)?(?:(\\\\.\\\\.\\\\.)\\\\s*)?(?<![:=])(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:(this)|([$_[:alpha:]][$_[:alnum:]]*))\\\\s*(\\\\??)(?=\\\\s*(:\\\\s*((<)|(\\\\(\\\\s*((\\\\))|(\\\\.\\\\.\\\\.)|([$_[:alnum:]]+\\\\s*(([,:=?])|(\\\\)\\\\s*=>)))))))|(:\\\\s*(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))Function(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.)))|(:\\\\s*((<\\\\s*)$|(\\\\(\\\\s*((([\\\\[{]\\\\s*)?)$|((\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})\\\\s*((:\\\\s*\\\\{?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*)))|((\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])\\\\s*((:\\\\s*\\\\[?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*))))))))"},{"captures":{"1":{"name":"storage.modifier.js"},"2":{"name":"keyword.operator.rest.js"},"3":{"name":"variable.parameter.js variable.language.this.js"},"4":{"name":"variable.parameter.js"},"5":{"name":"keyword.operator.optional.js"}},"match":"(?:(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(public|private|protected|readonly)\\\\s+)?(?:(\\\\.\\\\.\\\\.)\\\\s*)?(?<![:=])(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:(this)|([$_[:alpha:]][$_[:alnum:]]*))\\\\s*(\\\\??)(?=:)"},{"include":"#type-annotation"},{"match":",","name":"punctuation.separator.parameter.js"},{"include":"#type"}]},"type-predicate-operator":{"patterns":[{"captures":{"1":{"name":"keyword.operator.type.asserts.js"},"2":{"name":"variable.parameter.js variable.language.this.js"},"3":{"name":"variable.parameter.js"},"4":{"name":"keyword.operator.expression.is.js"}},"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:(asserts)\\\\s+)?(?!asserts)(?:(this)|([$_[:alpha:]][$_[:alnum:]]*))\\\\s(is)(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))"},{"captures":{"1":{"name":"keyword.operator.type.asserts.js"},"2":{"name":"variable.parameter.js variable.language.this.js"},"3":{"name":"variable.parameter.js"}},"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(asserts)\\\\s+(?!is)(?:(this)|([$_[:alpha:]][$_[:alnum:]]*))(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))"},{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))asserts(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","name":"keyword.operator.type.asserts.js"},{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))is(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","name":"keyword.operator.expression.is.js"}]},"type-primitive":{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(string|number|bigint|boolean|symbol|any|void|never|unknown)(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","name":"support.type.primitive.js"},"type-string":{"patterns":[{"include":"#qstring-single"},{"include":"#qstring-double"},{"include":"#template-type"}]},"type-tuple":{"begin":"\\\\[","beginCaptures":{"0":{"name":"meta.brace.square.js"}},"end":"]","endCaptures":{"0":{"name":"meta.brace.square.js"}},"name":"meta.type.tuple.js","patterns":[{"match":"\\\\.\\\\.\\\\.","name":"keyword.operator.rest.js"},{"captures":{"1":{"name":"entity.name.label.js"},"2":{"name":"keyword.operator.optional.js"},"3":{"name":"punctuation.separator.label.js"}},"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))([$_[:alpha:]][$_[:alnum:]]*)\\\\s*(\\\\?)?\\\\s*(:)"},{"include":"#type"},{"include":"#punctuation-comma"}]},"typeof-operator":{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))typeof(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","beginCaptures":{"0":{"name":"keyword.operator.expression.typeof.js"}},"end":"(?=[]\\\\&),:;=>?{|}]|(extends\\\\s+)|$|;|^\\\\s*$|^\\\\s*(?:abstract|async|\\\\bawait\\\\s+\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b\\\\b|break|case|catch|class|const|continue|declare|do|else|enum|export|finally|function|for|goto|if|import|interface|let|module|namespace|switch|return|throw|try|type|\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b|var|while)\\\\b)","patterns":[{"include":"#type-arguments"},{"include":"#expression"}]},"undefined-literal":{"match":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))undefined(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))","name":"constant.language.undefined.js"},"var-expr":{"patterns":[{"begin":"(?=(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:\\\\b(export)\\\\s+)?(?:\\\\b(declare)\\\\s+)?\\\\b(var|let)(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.)))","end":"(?!(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:\\\\b(export)\\\\s+)?(?:\\\\b(declare)\\\\s+)?\\\\b(var|let)(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.)))((?=^|[;}]|((?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(of|in)\\\\s+)|;|^\\\\s*$|^\\\\s*(?:abstract|async|\\\\bawait\\\\s+\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b\\\\b|break|case|catch|class|const|continue|declare|do|else|enum|export|finally|function|for|goto|if|import|interface|let|module|namespace|switch|return|throw|try|type|\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b|var|while)\\\\b)|((?<!^let|[^$._[:alnum:]]let|^var|[^$._[:alnum:]]var)(?=\\\\s*$)))","name":"meta.var.expr.js","patterns":[{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:\\\\b(export)\\\\s+)?(?:\\\\b(declare)\\\\s+)?\\\\b(var|let)(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))\\\\s*","beginCaptures":{"1":{"name":"keyword.control.export.js"},"2":{"name":"storage.modifier.js"},"3":{"name":"storage.type.js"}},"end":"(?=\\\\S)"},{"include":"#destructuring-variable"},{"include":"#var-single-variable"},{"include":"#variable-initializer"},{"include":"#comment"},{"begin":"(,)\\\\s*(?=$|//)","beginCaptures":{"1":{"name":"punctuation.separator.comma.js"}},"end":"(?<!,)(((?=[;=}]|((?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(of|in)\\\\s+)|^\\\\s*$))|((?<=\\\\S)(?=\\\\s*$)))","patterns":[{"include":"#single-line-comment-consuming-line-ending"},{"include":"#comment"},{"include":"#destructuring-variable"},{"include":"#var-single-variable"},{"include":"#punctuation-comma"}]},{"include":"#punctuation-comma"}]},{"begin":"(?=(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:\\\\b(export)\\\\s+)?(?:\\\\b(declare)\\\\s+)?\\\\b(const(?!\\\\s+enum\\\\b))(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.)))","beginCaptures":{"1":{"name":"keyword.control.export.js"},"2":{"name":"storage.modifier.js"},"3":{"name":"storage.type.js"}},"end":"(?!(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:\\\\b(export)\\\\s+)?(?:\\\\b(declare)\\\\s+)?\\\\b(const(?!\\\\s+enum\\\\b))(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.)))((?=^|[;}]|((?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(of|in)\\\\s+)|;|^\\\\s*$|^\\\\s*(?:abstract|async|\\\\bawait\\\\s+\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b\\\\b|break|case|catch|class|const|continue|declare|do|else|enum|export|finally|function|for|goto|if|import|interface|let|module|namespace|switch|return|throw|try|type|\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b|var|while)\\\\b)|((?<!(?:^|[^$._[:alnum:]])const)(?=\\\\s*$)))","name":"meta.var.expr.js","patterns":[{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:\\\\b(export)\\\\s+)?(?:\\\\b(declare)\\\\s+)?\\\\b(const(?!\\\\s+enum\\\\b))(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))\\\\s*","beginCaptures":{"1":{"name":"keyword.control.export.js"},"2":{"name":"storage.modifier.js"},"3":{"name":"storage.type.js"}},"end":"(?=\\\\S)"},{"include":"#destructuring-const"},{"include":"#var-single-const"},{"include":"#variable-initializer"},{"include":"#comment"},{"begin":"(,)\\\\s*(?=$|//)","beginCaptures":{"1":{"name":"punctuation.separator.comma.js"}},"end":"(?<!,)(((?=[;=}]|((?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(of|in)\\\\s+)|^\\\\s*$))|((?<=\\\\S)(?=\\\\s*$)))","patterns":[{"include":"#single-line-comment-consuming-line-ending"},{"include":"#comment"},{"include":"#destructuring-const"},{"include":"#var-single-const"},{"include":"#punctuation-comma"}]},{"include":"#punctuation-comma"}]},{"begin":"(?=(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:\\\\b(export)\\\\s+)?(?:\\\\b(declare)\\\\s+)?\\\\b\\\\b(using(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])|await\\\\s+\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b)\\\\b(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.)))","beginCaptures":{"1":{"name":"keyword.control.export.js"},"2":{"name":"storage.modifier.js"},"3":{"name":"storage.type.js"}},"end":"(?!(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:\\\\b(export)\\\\s+)?(?:\\\\b(declare)\\\\s+)?\\\\b\\\\b(using(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])|await\\\\s+\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b)\\\\b(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.)))((?=[;}]|((?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(of|in)\\\\s+)|;|^\\\\s*$|^\\\\s*(?:abstract|async|\\\\bawait\\\\s+\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b\\\\b|break|case|catch|class|const|continue|declare|do|else|enum|export|finally|function|for|goto|if|import|interface|let|module|namespace|switch|return|throw|try|type|\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b|var|while)\\\\b)|((?<!(?:^|[^$._[:alnum:]]|^await\\\\s+|[^$._[:alnum:]]await\\\\s+)using)(?=\\\\s*$)))","name":"meta.var.expr.js","patterns":[{"begin":"(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(?:\\\\b(export)\\\\s+)?(?:\\\\b(declare)\\\\s+)?\\\\b\\\\b(using(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])|await\\\\s+\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b)\\\\b(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.))\\\\s*","beginCaptures":{"1":{"name":"keyword.control.export.js"},"2":{"name":"storage.modifier.js"},"3":{"name":"storage.type.js"}},"end":"(?=\\\\S)"},{"include":"#var-single-const"},{"include":"#variable-initializer"},{"include":"#comment"},{"begin":"(,)\\\\s*((?!\\\\S)|(?=//))","beginCaptures":{"1":{"name":"punctuation.separator.comma.js"}},"end":"(?<!,)(((?=[;=}]|((?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(of|in)\\\\s+)|^\\\\s*$))|((?<=\\\\S)(?=\\\\s*$)))","patterns":[{"include":"#single-line-comment-consuming-line-ending"},{"include":"#comment"},{"include":"#var-single-const"},{"include":"#punctuation-comma"}]},{"include":"#punctuation-comma"}]}]},"var-single-const":{"patterns":[{"begin":"([$_[:alpha:]][$_[:alnum:]]*)(?=\\\\s*(=\\\\s*(((async\\\\s+)?((function\\\\s*[(*<])|(function\\\\s+)|([$_[:alpha:]][$_[:alnum:]]*\\\\s*=>)))|((async\\\\s*)?(((<\\\\s*)$|(\\\\(\\\\s*((([\\\\[{]\\\\s*)?)$|((\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})\\\\s*((:\\\\s*\\\\{?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*)))|((\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])\\\\s*((:\\\\s*\\\\[?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*))))))|((<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*)?\\\\(\\\\s*(/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*)*((\\\\)\\\\s*:)|((\\\\.\\\\.\\\\.\\\\s*)?[$_[:alpha:]][$_[:alnum:]]*\\\\s*:)))|(<\\\\s*[$_[:alpha:]][$_[:alnum:]]*\\\\s+extends\\\\s*[^=>])|((<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*)?\\\\(\\\\s*(/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*)*(([$_[:alpha:]]|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])|(\\\\.\\\\.\\\\.\\\\s*[$_[:alpha:]]))([^\\"\'()`]|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`))*)?\\\\)(\\\\s*:\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+)?\\\\s*=>)))))|(:\\\\s*((<)|(\\\\(\\\\s*((\\\\))|(\\\\.\\\\.\\\\.)|([$_[:alnum:]]+\\\\s*(([,:=?])|(\\\\)\\\\s*=>)))))))|(:\\\\s*(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))Function(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.)))|(:\\\\s*((<\\\\s*)$|(\\\\(\\\\s*((([\\\\[{]\\\\s*)?)$|((\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})\\\\s*((:\\\\s*\\\\{?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*)))|((\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])\\\\s*((:\\\\s*\\\\[?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*)))))))|(:\\\\s*(=>|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(<[^<>]*>)|[^(),<=>])+=\\\\s*(((async\\\\s+)?((function\\\\s*[(*<])|(function\\\\s+)|([$_[:alpha:]][$_[:alnum:]]*\\\\s*=>)))|((async\\\\s*)?(((<\\\\s*)$|(\\\\(\\\\s*((([\\\\[{]\\\\s*)?)$|((\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})\\\\s*((:\\\\s*\\\\{?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*)))|((\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])\\\\s*((:\\\\s*\\\\[?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*))))))|((<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*)?\\\\(\\\\s*(/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*)*((\\\\)\\\\s*:)|((\\\\.\\\\.\\\\.\\\\s*)?[$_[:alpha:]][$_[:alnum:]]*\\\\s*:)))|(<\\\\s*[$_[:alpha:]][$_[:alnum:]]*\\\\s+extends\\\\s*[^=>])|((<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*)?\\\\(\\\\s*(/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*)*(([$_[:alpha:]]|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])|(\\\\.\\\\.\\\\.\\\\s*[$_[:alpha:]]))([^\\"\'()`]|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`))*)?\\\\)(\\\\s*:\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+)?\\\\s*=>))))))","beginCaptures":{"1":{"name":"meta.definition.variable.js variable.other.constant.js entity.name.function.js"}},"end":"(?=$|^|[,;=}]|((?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(of|in)\\\\s+)|(;|^\\\\s*$|^\\\\s*(?:abstract|async|\\\\bawait\\\\s+\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b\\\\b|break|case|catch|class|const|continue|declare|do|else|enum|export|finally|function|for|goto|if|import|interface|let|module|namespace|switch|return|throw|try|type|\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b|var|while)\\\\b))","name":"meta.var-single-variable.expr.js","patterns":[{"include":"#var-single-variable-type-annotation"}]},{"begin":"([$_[:alpha:]][$_[:alnum:]]*)","beginCaptures":{"1":{"name":"meta.definition.variable.js variable.other.constant.js"}},"end":"(?=$|^|[,;=}]|((?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(of|in)\\\\s+)|(;|^\\\\s*$|^\\\\s*(?:abstract|async|\\\\bawait\\\\s+\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b\\\\b|break|case|catch|class|const|continue|declare|do|else|enum|export|finally|function|for|goto|if|import|interface|let|module|namespace|switch|return|throw|try|type|\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b|var|while)\\\\b))","name":"meta.var-single-variable.expr.js","patterns":[{"include":"#var-single-variable-type-annotation"}]}]},"var-single-variable":{"patterns":[{"begin":"([$_[:alpha:]][$_[:alnum:]]*)(!)?(?=\\\\s*(=\\\\s*(((async\\\\s+)?((function\\\\s*[(*<])|(function\\\\s+)|([$_[:alpha:]][$_[:alnum:]]*\\\\s*=>)))|((async\\\\s*)?(((<\\\\s*)$|(\\\\(\\\\s*((([\\\\[{]\\\\s*)?)$|((\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})\\\\s*((:\\\\s*\\\\{?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*)))|((\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])\\\\s*((:\\\\s*\\\\[?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*))))))|((<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*)?\\\\(\\\\s*(/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*)*((\\\\)\\\\s*:)|((\\\\.\\\\.\\\\.\\\\s*)?[$_[:alpha:]][$_[:alnum:]]*\\\\s*:)))|(<\\\\s*[$_[:alpha:]][$_[:alnum:]]*\\\\s+extends\\\\s*[^=>])|((<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*)?\\\\(\\\\s*(/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*)*(([$_[:alpha:]]|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])|(\\\\.\\\\.\\\\.\\\\s*[$_[:alpha:]]))([^\\"\'()`]|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`))*)?\\\\)(\\\\s*:\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+)?\\\\s*=>)))))|(:\\\\s*((<)|(\\\\(\\\\s*((\\\\))|(\\\\.\\\\.\\\\.)|([$_[:alnum:]]+\\\\s*(([,:=?])|(\\\\)\\\\s*=>)))))))|(:\\\\s*(?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))Function(?![$_[:alnum:]])(?:(?=\\\\.\\\\.\\\\.)|(?!\\\\.)))|(:\\\\s*((<\\\\s*)$|(\\\\(\\\\s*((([\\\\[{]\\\\s*)?)$|((\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})\\\\s*((:\\\\s*\\\\{?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*)))|((\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])\\\\s*((:\\\\s*\\\\[?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*)))))))|(:\\\\s*(=>|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(<[^<>]*>)|[^(),<=>])+=\\\\s*(((async\\\\s+)?((function\\\\s*[(*<])|(function\\\\s+)|([$_[:alpha:]][$_[:alnum:]]*\\\\s*=>)))|((async\\\\s*)?(((<\\\\s*)$|(\\\\(\\\\s*((([\\\\[{]\\\\s*)?)$|((\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})\\\\s*((:\\\\s*\\\\{?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*)))|((\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])\\\\s*((:\\\\s*\\\\[?)$|((\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+\\\\s*)?=\\\\s*))))))|((<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*)?\\\\(\\\\s*(/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*)*((\\\\)\\\\s*:)|((\\\\.\\\\.\\\\.\\\\s*)?[$_[:alpha:]][$_[:alnum:]]*\\\\s*:)))|(<\\\\s*[$_[:alpha:]][$_[:alnum:]]*\\\\s+extends\\\\s*[^=>])|((<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<]|<\\\\s*(((const\\\\s+)?[$_[:alpha:]])|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*]))([^<=>]|=[^<])*>)*>)*>\\\\s*)?\\\\(\\\\s*(/\\\\*([^*]|(\\\\*[^/]))*\\\\*/\\\\s*)*(([$_[:alpha:]]|(\\\\{([^{}]|(\\\\{([^{}]|\\\\{[^{}]*})*}))*})|(\\\\[([^]\\\\[]|(\\\\[([^]\\\\[]|\\\\[[^]\\\\[]*])*]))*])|(\\\\.\\\\.\\\\.\\\\s*[$_[:alpha:]]))([^\\"\'()`]|(\\\\(([^()]|(\\\\(([^()]|\\\\([^()]*\\\\))*\\\\)))*\\\\))|(\'([^\'\\\\\\\\]|\\\\\\\\.)*\')|(\\"([^\\"\\\\\\\\]|\\\\\\\\.)*\\")|(`([^\\\\\\\\`]|\\\\\\\\.)*`))*)?\\\\)(\\\\s*:\\\\s*([^()<>{}]|<([^<>]|<([^<>]|<[^<>]+>)+>)+>|\\\\([^()]+\\\\)|\\\\{[^{}]+})+)?\\\\s*=>))))))","beginCaptures":{"1":{"name":"meta.definition.variable.js entity.name.function.js"},"2":{"name":"keyword.operator.definiteassignment.js"}},"end":"(?=$|^|[,;=}]|((?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(of|in)\\\\s+)|(;|^\\\\s*$|^\\\\s*(?:abstract|async|\\\\bawait\\\\s+\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b\\\\b|break|case|catch|class|const|continue|declare|do|else|enum|export|finally|function|for|goto|if|import|interface|let|module|namespace|switch|return|throw|try|type|\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b|var|while)\\\\b))","name":"meta.var-single-variable.expr.js","patterns":[{"include":"#var-single-variable-type-annotation"}]},{"begin":"(\\\\p{upper}[$_\\\\d[:upper:]]*)(?![$_[:alnum:]])(!)?","beginCaptures":{"1":{"name":"meta.definition.variable.js variable.other.constant.js"},"2":{"name":"keyword.operator.definiteassignment.js"}},"end":"(?=$|^|[,;=}]|((?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(of|in)\\\\s+)|(;|^\\\\s*$|^\\\\s*(?:abstract|async|\\\\bawait\\\\s+\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b\\\\b|break|case|catch|class|const|continue|declare|do|else|enum|export|finally|function|for|goto|if|import|interface|let|module|namespace|switch|return|throw|try|type|\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b|var|while)\\\\b))","name":"meta.var-single-variable.expr.js","patterns":[{"include":"#var-single-variable-type-annotation"}]},{"begin":"([$_[:alpha:]][$_[:alnum:]]*)(!)?","beginCaptures":{"1":{"name":"meta.definition.variable.js variable.other.readwrite.js"},"2":{"name":"keyword.operator.definiteassignment.js"}},"end":"(?=$|^|[,;=}]|((?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(of|in)\\\\s+)|(;|^\\\\s*$|^\\\\s*(?:abstract|async|\\\\bawait\\\\s+\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b\\\\b|break|case|catch|class|const|continue|declare|do|else|enum|export|finally|function|for|goto|if|import|interface|let|module|namespace|switch|return|throw|try|type|\\\\busing(?=\\\\s+(?!in\\\\b|of\\\\b(?!\\\\s*(?:of\\\\b|=)))[$_[:alpha:]])\\\\b|var|while)\\\\b))","name":"meta.var-single-variable.expr.js","patterns":[{"include":"#var-single-variable-type-annotation"}]}]},"var-single-variable-type-annotation":{"patterns":[{"include":"#type-annotation"},{"include":"#string"},{"include":"#comment"}]},"variable-initializer":{"patterns":[{"begin":"(?<![!=])(=)(?!=)(?=\\\\s*\\\\S)(?!\\\\s*.*=>\\\\s*$)","beginCaptures":{"1":{"name":"keyword.operator.assignment.js"}},"end":"(?=$|^|[]),;}]|((?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(of|in)\\\\s+))","patterns":[{"include":"#expression"}]},{"begin":"(?<![!=])(=)(?!=)","beginCaptures":{"1":{"name":"keyword.operator.assignment.js"}},"end":"(?=[]),;}]|((?<![$_[:alnum:]])(?:(?<=\\\\.\\\\.\\\\.)|(?<!\\\\.))(of|in)\\\\s+))|(?=^\\\\s*$)|(?<![-\\\\&*+/|])(?<=\\\\S)(?<!=)(?=\\\\s*$)","patterns":[{"include":"#expression"}]}]}},"scopeName":"source.js","aliases":["js","cjs","mjs"]}',
        ),
      );
      e.s(["default", 0, [n]]);
    },
  ],
  [
    [75400],
    (e) => {
      "use strict";
      let n = Object.freeze(
        JSON.parse(
          '{"displayName":"JSON with Comments","name":"jsonc","patterns":[{"include":"#value"}],"repository":{"array":{"begin":"\\\\[","beginCaptures":{"0":{"name":"punctuation.definition.array.begin.json.comments"}},"end":"]","endCaptures":{"0":{"name":"punctuation.definition.array.end.json.comments"}},"name":"meta.structure.array.json.comments","patterns":[{"include":"#value"},{"match":",","name":"punctuation.separator.array.json.comments"},{"match":"[^]\\\\s]","name":"invalid.illegal.expected-array-separator.json.comments"}]},"comments":{"patterns":[{"begin":"/\\\\*\\\\*(?!/)","captures":{"0":{"name":"punctuation.definition.comment.json.comments"}},"end":"\\\\*/","name":"comment.block.documentation.json.comments"},{"begin":"/\\\\*","captures":{"0":{"name":"punctuation.definition.comment.json.comments"}},"end":"\\\\*/","name":"comment.block.json.comments"},{"captures":{"1":{"name":"punctuation.definition.comment.json.comments"}},"match":"(//).*$\\\\n?","name":"comment.line.double-slash.js"}]},"constant":{"match":"\\\\b(?:true|false|null)\\\\b","name":"constant.language.json.comments"},"number":{"match":"-?(?:0|[1-9]\\\\d*)(?:(?:\\\\.\\\\d+)?(?:[Ee][-+]?\\\\d+)?)?","name":"constant.numeric.json.comments"},"object":{"begin":"\\\\{","beginCaptures":{"0":{"name":"punctuation.definition.dictionary.begin.json.comments"}},"end":"}","endCaptures":{"0":{"name":"punctuation.definition.dictionary.end.json.comments"}},"name":"meta.structure.dictionary.json.comments","patterns":[{"include":"#objectkey"},{"include":"#comments"},{"begin":":","beginCaptures":{"0":{"name":"punctuation.separator.dictionary.key-value.json.comments"}},"end":"(,)|(?=})","endCaptures":{"1":{"name":"punctuation.separator.dictionary.pair.json.comments"}},"name":"meta.structure.dictionary.value.json.comments","patterns":[{"include":"#value"},{"match":"[^,\\\\s]","name":"invalid.illegal.expected-dictionary-separator.json.comments"}]},{"match":"[^}\\\\s]","name":"invalid.illegal.expected-dictionary-separator.json.comments"}]},"objectkey":{"begin":"\\"","beginCaptures":{"0":{"name":"punctuation.support.type.property-name.begin.json.comments"}},"end":"\\"","endCaptures":{"0":{"name":"punctuation.support.type.property-name.end.json.comments"}},"name":"string.json.comments support.type.property-name.json.comments","patterns":[{"include":"#stringcontent"}]},"string":{"begin":"\\"","beginCaptures":{"0":{"name":"punctuation.definition.string.begin.json.comments"}},"end":"\\"","endCaptures":{"0":{"name":"punctuation.definition.string.end.json.comments"}},"name":"string.quoted.double.json.comments","patterns":[{"include":"#stringcontent"}]},"stringcontent":{"patterns":[{"match":"\\\\\\\\(?:[\\"/\\\\\\\\bfnrt]|u\\\\h{4})","name":"constant.character.escape.json.comments"},{"match":"\\\\\\\\.","name":"invalid.illegal.unrecognized-string-escape.json.comments"}]},"value":{"patterns":[{"include":"#constant"},{"include":"#number"},{"include":"#string"},{"include":"#array"},{"include":"#object"},{"include":"#comments"}]}},"scopeName":"source.json.comments"}',
        ),
      );
      e.s(["default", 0, [n]]);
    },
  ],
  [
    [946834],
    (e) => {
      "use strict";
      let n;
      var t = e.i(77313),
        l = e.i(228426),
        a = e.i(122952),
        o = e.i(75400),
        i = e.i(883808);
      let r = (0, t.a)({
        name: "code",
        variablePrefix: "--code-syntax-",
        fontStyle: !1,
      });
      e.s([
        "highlight",
        0,
        function (e, s) {
          return (n ??= (0, t.b)({
            themes: [r],
            langs: [a.default, o.default, i.default],
            engine: (0, l.f)(),
          }))
            .codeToTokensBase(e, { lang: s, theme: "code" })
            .map((e) => e.map((e) => ({ text: e.content, color: e.color })));
        },
      ]);
    },
  ],
  [
    [369587],
    (e) => {
      "use strict";
      let n = {}.hasOwnProperty;
      e.s([
        "f",
        0,
        function (e, t) {
          let l = t || {};
          function a(t, ...l) {
            let o = a.invalid,
              i = a.handlers;
            if (t && n.call(t, e)) {
              let l = String(t[e]);
              o = n.call(i, l) ? i[l] : a.unknown;
            }
            if (o) return o.call(this, t, ...l);
          }
          return (
            (a.handlers = l.handlers || {}),
            (a.invalid = l.invalid),
            (a.unknown = l.unknown),
            a
          );
        },
      ]);
    },
  ],
  [
    [241631],
    (e) => {
      "use strict";
      e.s([
        "f",
        0,
        [
          "area",
          "base",
          "basefont",
          "bgsound",
          "br",
          "col",
          "command",
          "embed",
          "frame",
          "hr",
          "image",
          "img",
          "input",
          "keygen",
          "link",
          "meta",
          "param",
          "source",
          "track",
          "wbr",
        ],
      ]);
    },
  ],
];
