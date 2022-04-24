import { Button, Input, VStack, Text, HStack } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import ConversationArea from '../../classes/ConversationArea';
import { GameState } from '../../classes/GameTypes';
import useCoveyAppState from '../../hooks/useCoveyAppState';
import usePlayerConversationArea from '../../hooks/usePlayerConversationArea';

type WordleRowProps = {
  guessArray: string[],
  letterColors: number[],
  showLetters: boolean
}

type WordleLetterProps = {
  letter: string,
  color: number
}

type AllRowsProps = {
  guessRows: JSX.Element[] | undefined
}

type GameBoardProps = {
  gameover: boolean
}

/**
 * A button representing a guessed letter as part of a wordle row, with the correct color (gray, green, or yellow)
 * @param props the letter to display and its color 
 * @returns JSX.Element representing one guessed letter
 */
// add map or dictionary to relate color to number
function WordleLetter(props: WordleLetterProps): JSX.Element {
  const { letter, color } = props;
  const letterColorMatch = new Map([[0, 'gray'], [1, 'green'], [-1, 'yellow']]);

  return <Button size='sm' colorScheme={letterColorMatch.get(color)}>{letter}</Button>
}

/**
 * Constructs one guessed row of the Wordle Game, with letters and colors or partial information
 * @param props the guess to display and its corresponding color information for each letter, as well as a boolean telling us whether to show full or partial information
 * @returns JSX.Element representing an entire guessed wordle row
 */
function WordleRow(props: WordleRowProps): JSX.Element {
  const { guessArray, letterColors, showLetters } = props;

  return (
    <HStack spacing='12px'>
      {guessArray.map((guess, index) => <WordleLetter key={index.toString()} letter={(showLetters) ? guess : ''} color={letterColors[index]} />)}
    </HStack>
  );
}

/**
 * Returns a blank, unguessed row
 * @returns JSX.Element representing a blank, unguessed row
 */
function BlankRow(): JSX.Element {
  const blankRows = [];

  for (let i = 0; i < 5; i += 1) {
    blankRows.push(<Button size='sm' variant='outline' />);
  }

  return <HStack spacing='12px'>{blankRows}</HStack>
}

/**
 * All the rows for a particular team's board, consisting of their guessed rows with correct colors, as well as remaining unguessed rows
 * @param props the rows representing words the team has guessed
 * @returns JSX.Element of the entire team's board
 */
function AllRows(props: AllRowsProps): JSX.Element {
  const { guessRows } = props;
  const allRows = [];

  if (guessRows) {
    for (let i = 0; i < 6; i += 1) {
      allRows.push((guessRows.length > i) ? guessRows[i] : <BlankRow />);
    }
  }

  return <VStack>{allRows}</VStack>
}

/**
 * Should show the game board and its current state to both spectators and game players. Should also show a Wordle title bar,
 * the player's state, and an input tab for players to input guesses when it is their team's turn.
 */
export default function GameBoard(props: GameBoardProps): JSX.Element {
  const { apiClient, sessionToken, currentTownID } = useCoveyAppState();
  const { gameover } = props;
  const [playerID] = useState(useCoveyAppState().myPlayerID);
  const currentConversationArea = usePlayerConversationArea();
  const [input, setInput] = useState('');
  const [element, setElement] = useState(<></>);

  async function getGameState(convoArea: ConversationArea): Promise<GameState> {
    const stateInfo = await apiClient.getGameState({ coveyTownID: currentTownID, sessionToken, conversationAreaLabel: convoArea.label });
    return stateInfo.state;
  }

  function constructBoards(gameState: GameState) {
    const redTeam = gameState.teamOneState?.teamMembers.includes(playerID);
    const blueTeam = gameState.teamTwoState?.teamMembers.includes(playerID);
    const redGuesses = gameState.teamOneState?.guesses;
    const blueGuesses = gameState.teamTwoState?.guesses;
    const yourTeamHeader = (!redTeam && !blueTeam) ? 'You are Spectating!' : 'You are on a team!';
    const displayText = (gameover) ? 'Game Over' : yourTeamHeader;
    const redRows = redGuesses?.map((guess, index) =>
      <WordleRow key={index.toString()} guessArray={Array.from(guess.word)} letterColors={guess.guessResult} showLetters={(!blueTeam) || gameover} />);
    const blueRows = blueGuesses?.map((guess, index) =>
      <WordleRow key={index.toString()} guessArray={Array.from(guess.word)} letterColors={guess.guessResult} showLetters={(!redTeam) || gameover} />);
    const redBoard = <AllRows guessRows={redRows} />;
    const blueBoard = <AllRows guessRows={blueRows} />;

    setElement(
      <VStack padding={4} align='center'>
        <Text fontSize='xl'>Wordle</Text>
        <HStack spacing='24px'>
          <VStack>
            <Text fontSize='sm'>Red Board</Text>
            {redBoard}
          </VStack>
          <VStack>
            <Text fontSize='sm'>Blue Board</Text>
            {blueBoard}
          </VStack>
        </HStack>
        <Text fontSize='lg'>{displayText}</Text>
        <Input
          size='sm'
          value={input}
          onChange={(e) => setInput(e.currentTarget.value)}
          onKeyPress={e => {
            if (e.key === 'Enter') {
              // apiClient.inputAction();
            }
          }}
          isDisabled={(!redTeam && !blueTeam)} />
      </VStack>);
  }

  // ensure the game session is active, then display the game board
  if (currentConversationArea?.game) {
    console.log('in the if statement');
    getGameState(currentConversationArea).then((gameState) => {
      console.log('in the .then');
      console.log(gameState);
      constructBoards(gameState);
      console.log(element);
    });
  }

  return element;
}