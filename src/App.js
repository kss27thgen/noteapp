import React, { Component } from "react";
import "./App.css";
import { withAuthenticator } from "aws-amplify-react";
import { API, graphqlOperation } from "aws-amplify";
import { createNote, deleteNote, updateNote } from "./graphql/mutations";
import { listNotes } from "./graphql/queries";
import {
	onCreateNote,
	onDeleteNote,
	onUpdateNote,
} from "./graphql/subscriptions";

class App extends Component {
	state = {
		id: "",
		note: "",
		notes: [],
	};

	async componentDidMount() {
		this.getNotes();

		this.createNoteListener = API.graphql(
			graphqlOperation(onCreateNote),
		).subscribe({
			next: (noteData) => {
				const newNote = noteData.value.data.onCreateNote;
				const prevNotes = this.state.notes.filter(
					(note) => note.id !== newNote.id,
				);
				const updatedNotes = [...prevNotes, newNote];
				this.setState({ notes: updatedNotes });
			},
		});

		this.deleteNoteListener = API.graphql(
			graphqlOperation(onDeleteNote),
		).subscribe({
			next: (noteData) => {
				const deletedNote = noteData.value.data.onDeleteNote;
				const updatedNotes = this.state.notes.filter(
					(note) => note.id !== deletedNote.id,
				);
				this.setState({ notes: updatedNotes });
			},
		});

		this.updateNoteListener = API.graphql(
			graphqlOperation(onUpdateNote),
		).subscribe({
			next: (noteData) => {
				const { notes } = this.state;
				const updatedNote = noteData.value.data.onUpdateNote;
				const index = notes.findIndex(
					(note) => note.id === updatedNote.id,
				);
				const updatedNotes = [
					...notes.slice(0, index),
					updatedNote,
					...notes.slice(index + 1),
				];
				this.setState({ notes: updatedNotes, note: "" });
			},
		});
	}

	componentWillUnmount() {
		this.createNoteListener.unsubscribe();
		this.deleteNoteListener.unsubscribe();
		this.updateNoteListener.unsubscribe();
	}

	getNotes = async () => {
		const result = await API.graphql(graphqlOperation(listNotes));
		this.setState({ notes: result.data.listNotes.items });
	};

	handleChangeNote = (e) => {
		this.setState({
			note: e.target.value,
		});
	};

	hasExistingNote = () => {
		const { notes, id } = this.state;
		if (id) {
			const isNote = notes.findIndex((note) => note.id === id) > -1;
			return isNote;
		}
		return false;
	};

	handleAddNote = async (e) => {
		e.preventDefault();
		const { note } = this.state;

		if (this.hasExistingNote()) {
			this.handleUpdateNote();
		} else {
			const input = { note };
			await API.graphql(graphqlOperation(createNote, { input }));

			this.setState({ note: "" });
		}
	};

	handleUpdateNote = async () => {
		const { note, id } = this.state;
		const input = { note, id };
		await API.graphql(graphqlOperation(updateNote, { input }));
	};

	handleDeleteNote = async (noteId) => {
		const input = { id: noteId };
		await API.graphql(graphqlOperation(deleteNote, { input }));
	};

	handleSetNote = ({ note, id }) => {
		this.setState({ note, id });
	};

	render() {
		const { notes, note, id } = this.state;

		return (
			<div className="flex flex-column items-center justify-center pa3 bg-washed-red">
				<h1 className="code f2-1">Amplify Notetaker</h1>
				<form className="mb3" onSubmit={this.handleAddNote}>
					<input
						type="text"
						className="pa2 f4"
						placeholder="Write your note.."
						value={note}
						onChange={this.handleChangeNote}
					/>
					<button className="pa2 f4" type="submit">
						{id ? "Update note" : "Add note"}
					</button>
				</form>

				<div>
					{notes.map((item) => (
						<div key={item.id} className="flex items-center">
							<li
								className="list pa1 f3"
								onClick={() => this.handleSetNote(item)}
							>
								{item.note}
							</li>
							<button
								className="bg-transparent bn f4"
								onClick={() => this.handleDeleteNote(item.id)}
							>
								<span>&times;</span>
							</button>
						</div>
					))}
				</div>
			</div>
		);
	}
}

export default withAuthenticator(App, { includeGreetings: true });
