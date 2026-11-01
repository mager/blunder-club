import { Chess } from 'chess.js';
import type { LessonStep, SkillId, StudyLesson } from './lesson-types';
const position=(moves:string[])=>{const board=new Chess();for(const move of moves)board.move(move);return board.fen();};
const step=(move:string,title:string,question:string,hint:string,why:string,skill:SkillId,reply?:string,goal?:LessonStep['goal']):LessonStep=>({move,title,question,hint,why,skill,short:title,...(reply?{reply}:{}),...(goal?{goal}:{})});
const drill=(id:string,title:string,skill:SkillId,fen:string,steps:LessonStep[],completion:string,level:StudyLesson['level']='Start'):StudyLesson=>({id,title,kind:'scenario',skill,level,fen,steps,completion,detail:steps[0].question,focus:steps[0].title,tip:steps[0].hint});
export const scenarios:StudyLesson[]=[
  drill('hanging','The loose queen','tactics','6k1/5ppp/8/3q4/8/4N3/5PPP/6K1 w - - 0 1',[
    step('e3d5','A free queen.','Find the safe capture.','Your knight can reach the queen.','Nxd5 takes an undefended queen. Scan captures before making a quiet move.','tactics'),
  ],'You checked captures before moving.'),
  drill('mate','Close the door','king','6k1/5ppp/8/8/8/8/5PPP/4R1K1 w - - 0 1',[
    step('e1e8','Find checkmate.','The king has no escape through its own pawns.','Put your rook on the back rank.','Re8 is mate: the rook checks along the rank, and the pawns block the king.','king',undefined,'mate'),
  ],'A boxed-in king needs an escape square.'),
  drill('fork','Double trouble','tactics','3r3k/6pp/8/4N3/8/8/6PP/6K1 w - - 0 1',[
    step('e5f7','Two targets.','Check the king and attack the rook with one move.','A knight on f7 attacks h8 and d8.','Nf7 checks the king while attacking the rook. The king must move first.','tactics','h8g8'),
    step('f7d8','Collect the rook.','The king moved. Finish your fork.','The rook on d8 is still under attack.','Nxd8 wins the rook. A fork matters when you collect the second target.','tactics'),
  ],'Check first. Collect the second target.', 'Build'),
  drill('long-diagonal','Long-distance gift','tactics','r5k1/5ppp/8/8/8/8/5PBP/6K1 w - - 0 1',[
    step('g2a8','Follow the diagonal.','Find the rook your bishop can take.','Trace the diagonal from g2 to a8.','Bxa8 wins the undefended rook. Long diagonals can hide a capture.','tactics'),
  ],'You followed the whole diagonal.'),
  drill('royal-fork','Royal double','tactics','3q3k/6pp/8/4N3/8/8/6PP/6K1 w - - 0 1',[
    step('e5f7','Fork the royals.','Attack the king and queen together.','The knight wants f7.','Nf7 checks the king and attacks the queen on d8.','tactics','h8g8'),
    step('f7d8','Take the queen.','Finish the tactic.','Your knight can capture on d8.','Nxd8 turns the fork into a queen won.','tactics'),
  ],'A forcing move gave you time to win the queen.','Build'),
  drill('queen-fork','Across the board','tactics','k7/8/2r5/8/8/8/5PPP/3Q2K1 w - - 0 1',[
    step('d1a4','One move, two attacks.','Check the king while attacking the rook.','From a4, the queen sees a8 and c6.','Qa4 checks along the a-file and attacks the rook on c6.','tactics','a8b8'),
    step('a4c6','Cash it in.','The rook is loose. Take it.','Look along the diagonal to c6.','Qxc6 wins the rook after the king leaves the file.','tactics'),
  ],'Queens can fork across a rank and diagonal.','Build'),
  drill('pinned-defender','The frozen guard','tactics','4k3/4n3/6q1/8/8/8/2B2PPP/4R1K1 w - - 0 1',[
    step('c2g6','Can that knight move?','Take the queen without losing your bishop to the knight.','Your rook pins the knight to its king.','Bxg6 wins the queen. The knight on e7 cannot capture: that would expose its king to the rook on e1.','tactics'),
  ],'A pinned defender may not be able to defend.','Stretch'),
  drill('pawn-fork','Small pawn, big problem','tactics','6k1/5ppp/8/2n1b3/8/3PP3/5PPP/6K1 w - - 0 1',[
    step('d3d4','Fork with a pawn.','Attack the bishop and knight at the same time.','Your e3 pawn supports d4.','d4 attacks c5 and e5. The e3 pawn protects the forking pawn.','tactics','e5f6'),
    step('d4c5','Take the knight.','One target escaped. Collect the other.','Pawns capture diagonally.','dxc5 wins the knight left behind by the bishop.','tactics'),
  ],'Check that your forking piece is protected.','Build'),
  drill('save-rook','No free lunch','safety','6k1/5ppp/8/8/8/8/1b3PPP/R5K1 w - - 0 1',[
    {...step('a1a8','Your rook is attacked.','Move the rook to a safe square.','The bishop attacks a1, a3, and c1. Avoid those squares.','You moved the rook out of the bishop’s attack. Check the destination before you move.','safety'),alternatives:['a1a2','a1a4','a1a5','a1a6','a1a7','a1b1','a1d1','a1e1','a1f1']},
  ],'An attacked piece needs a safe destination.'),
  drill('block-check','Close the file','king','4r1k1/5ppp/8/8/2B5/8/5PPP/4K3 w - - 0 1',[
    step('c4e2','You are in check.','Block the rook’s line with your bishop.','Find a bishop move onto the e-file.','Be2 blocks the check. Your king protects the bishop, so the rook cannot take it for free.','king'),
  ],'Against a line check: capture, block, or move the king.'),
  drill('capture-checker','Take the threat','king','6k1/5ppp/8/8/8/6r1/5B1P/6K1 w - - 0 1',[
    step('f2g3','Remove the check.','Capture the piece checking your king.','Your bishop can take the rook.','Bxg3 removes the checking rook. Check captures before running with your king.','king'),
  ],'Taking the checker can solve two problems.'),
  drill('queen-mate','Queen on the back rank','king','6k1/5ppp/8/8/8/8/4QPPP/6K1 w - - 0 1',[
    step('e2e8','Finish in one.','Find checkmate with your queen.','The eighth rank is open.','Qe8 is mate. The queen covers the escape squares on the back rank.','king',undefined,'mate'),
  ],'A queen also controls ranks and files.'),
  drill('supported-mate','Bring a friend','king','7k/5Q2/5K2/8/8/8/8/8 w - - 0 1',[
    step('f7g7','A protected queen.','Find mate with your king’s help.','Your king protects g7.','Qg7 is mate. The black king cannot capture a queen protected by your king.','king',undefined,'mate'),
  ],'A close-range mate needs protection.'),
  drill('ladder-mate','The ladder','king','7k/R7/8/8/8/8/8/1R4K1 w - - 0 1',[
    step('b1b8','One rook holds. One checks.','Use both rooks to finish the game.','The a7 rook cuts off the seventh rank.','Rb8 is mate. One rook checks while the other prevents the king from stepping down.','king',undefined,'mate'),
  ],'Two rooks can take away one rank at a time.'),
  drill('avoid-stalemate','Leave no doubt','king','7k/4Q3/5K2/8/8/8/8/8 w - - 0 1',[
    step('e7g7','Check, not stalemate.','Finish with checkmate. A king with no moves is not enough.','Put your queen on g7, protected by your king.','Qg7 checks the king and removes every escape. Without check, no legal moves would mean a draw.','king',undefined,'mate'),
  ],'No legal moves plus check is mate. Without check, it is a draw.','Build'),
  drill('promotion','Level up','safety','7k/4P3/5K2/8/8/8/8/8 w - - 0 1',[
    step('e7e8q','Reach the last rank.','Promote your pawn to a queen.','Move e7 to e8, then choose the queen.','e8=Q turns the pawn into a queen. Always check for stalemate when you promote.','safety'),
  ],'A pawn can become your strongest piece.'),
  drill('underpromotion','Less is more','safety','8/k1P5/2K5/8/8/8/8/8 w - - 0 1',[
    step('c7c8r','Choose carefully.','Promote without drawing by stalemate.','A queen covers too many squares. Try a rook.','c8=R leaves the black king a legal move. c8=Q would be stalemate in this exact position.','safety'),
  ],'Promotion is a choice, not always a queen.','Stretch'),
  drill('pawn-sprint','Run for it','safety','7k/8/8/P7/8/8/8/K7 w - - 0 1',[
    step('a5a6','The king is too far away.','Push your passed pawn toward promotion.','No black pawn blocks its file.','a6 brings the pawn closer to promotion. The black king cannot reach it in time.','safety','h8g7'),
    step('a6a7','Keep going.','Your pawn is one step from the last rank.','Push to a7.','a7 threatens promotion on the next move.','safety','g7f6'),
    step('a7a8q','Make a queen.','Finish the race.','Move to a8 and choose the queen.','a8=Q completes the promotion. Now you can practise winning with the extra queen.','safety'),
  ],'Passed pawns become stronger as they get closer to promotion.','Build'),
  drill('en-passant','The passing lane','threats','6k1/5ppp/8/3pP3/8/8/5PPP/6K1 w - d6 0 2',[
    step('e5d6','That pawn just passed you.','Black just played d7–d5. Capture it en passant.','Move your pawn to d6, even though that square is empty.','exd6 captures the pawn on d5. En passant is available only immediately after the two-square pawn move.','threats'),
  ],'Some chances exist for only one move.','Build'),
  drill('castle-short','King’s shortcut','king','4k2r/5ppp/8/8/2B1P3/3P1N2/5PPP/4K2R w Kk - 0 1',[
    step('e1g1','Move two pieces at once.','Castle kingside.','Move the king two squares toward the rook.','O-O puts the king on g1 and rook on f1. The king cannot castle out of, through, or into check.','king'),
  ],'Castling gets the king safe and brings a rook into play.'),
  drill('castle-long','The long way home','king','4k2r/p4ppp/8/8/8/8/4PPPP/R3K3 w Qk - 0 1',[
    step('e1c1','Castle the other way.','Castle queenside.','Move the king from e1 to c1.','O-O-O moves the king to c1 and rook to d1. All squares between them must be empty.','king'),
  ],'Both sides of the board offer a castling route.','Build'),
  drill('center-tempo','Make the queen move','development',position(['e4','d5']),[
    step('e4d5','Trade in the center.','Capture the pawn that challenged your center.','Your e4 pawn can take on d5.','exd5 trades central pawns and opens a file. Black can recapture with the queen.','center','d8d5'),
    step('b1c3','Develop with tempo.','Bring out a knight while attacking the queen.','The b1 knight can reach c3.','Nc3 develops a piece and attacks d5. Black spends another turn moving the queen.','development','d5a5'),
  ],'Developing with an attack can win time.','Build'),
];
